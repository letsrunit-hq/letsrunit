import { Controller, Result } from '@letsrunit/controller';
import { generate } from '@letsrunit/ai';
import { deltaSteps, type Feature, parseFeature, makeFeature } from '@letsrunit/gherkin';
import type { Snapshot } from '@letsrunit/playwright';
import { splitUrl } from '@letsrunit/utils';
import * as z from 'zod';
import { ModelMessage, ToolSet } from 'ai';
import { describePage } from './describe-page';
import ISO6391 from 'iso-639-1';
import { statusSymbol } from '@letsrunit/utils';
import { detectPageChanges } from './detect-page-changes';
import { locatorRules } from './locator-rules';
import { Journal } from '@letsrunit/journal';

const PROMPT = `You're a QA tester, tasked with writing BDD tests in Gherkin format for a feature.

You will receive the page content from the user. Your job is to:
- Incrementally add \`When\` steps to complete a **single Gherkin scenario**.
- End the process by calling \`publish()\` once the scenario is fully satisfied.

## Completion Criteria

Only call \`publish()\` if the **user goal has been met**, based on the definition of done described in the scenario.
You must:
1. Verify that all actions required to achieve the user story are complete.
2. Confirm the presence of a final UI state (e.g. confirmation message, generated link, visible output) in the HTML.

**If these conditions are not met, do NOT call \`publish()\` yet. Continue adding relevant \`When\` steps.**

## Allowed \`When\` Steps:

Only use the following \`When\` steps:
{{#steps}}
  - {{.}}
{{/steps}}

## Parameters

* \`{locator}\` - A readable description of a page element
* \`{keys}\` - Keyboard input like "Enter" or "CTRL + S"
* \`{value}\` - A string or number like "Hello", 10

Locator rules:
${locatorRules}

## Workflow

The interaction follows this loop:

assistant: Gherkin feature
user: HTML page snapshot
assistant: add new \`When\` steps if needed
user: new HTML page snapshot or BDD run error
assistant: continue or call \`publish()\` if scenario goal is met

Do not add \`Given\` or \`Then\` steps.
Do not output the current feature without adding steps

📌 **Special Rules**:
- Do not add further steps once a \`link\` is clicked (indicating page navigation)
- Do not add \`When\` steps for elements that are not visible (yet)
{{#language}}- Use the {{language}} locale for number and date formatting{{/language}}
`;

interface Options {
  controller: Controller;
  page: Snapshot & { content?: string, lang?: string };
  feature: Feature;
  appInfo?: {
    purpose: string;
    loginAvailable: boolean;
  }
}

export const tools: ToolSet = {
  publish: {
    description: "Publish the feature.",
    inputSchema: z.object({}),
  },
};

async function determineThenSteps(old: Snapshot, current: Snapshot, journal?: Journal): Promise<string[]> {
  let steps: string[];

  if (old.url !== current.url) {
    const { path } = splitUrl(current.url);
    steps = [`Then I should be on page "${path}"`];
  } else {
    steps = await detectPageChanges(old, current, { journal });
  }

  journal?.batch().each(steps, (j, step) => j.success(step)).flush();

  return steps;
}

function invalidToMessages(
  feature: Feature | string,
  validatedSteps: { text: string, def?: string }[]
): ModelMessage[] {
  const invalidSteps = validatedSteps.filter((step) => !step.def);
  const userMessage = [
    `The following steps are do not have a step definition or are invalid:`,
    ...invalidSteps.map((s) => `- ${s}`),
  ].join('\n');

  return [
    { role: 'assistant', content: typeof feature === 'string' ? feature : makeFeature(feature) },
    { role: 'user', content: userMessage },
  ];
}

function failureToMessages(feature: Feature | string, runSteps: Result['steps'], runFailure?: Error): ModelMessage[] {
  const userMessage = [
    ...runSteps.map((s) => `${statusSymbol(s.status)} ${s.text}`),
    '',
    runFailure,
  ].join('\n');

  return [
    { role: 'assistant', content: typeof feature === 'string' ? feature : makeFeature(feature) },
    { role: 'user', content: userMessage },
  ];
}

export async function generateFeature({ controller, page, feature }: Options): Promise<Feature> {
  const whenSteps = controller.listSteps('When');

  let runCount = 0;
  let content = page.content ?? await describePage(page, 'html');
  let currentPage = page;

  const language = page.lang && (ISO6391.getName(page.lang.substring(0, 2)) || page.lang);

  const system = {
    template: PROMPT,
    vars: {
      steps: whenSteps,
      language,
    },
  };
  const steps = [...feature.steps];

  let messages: ModelMessage[] = [
    { role: 'assistant' as const, content: makeFeature({ ...feature, steps }) },
    { role: 'user' as const, content },
  ];

  await controller.run(makeFeature({ ...feature, steps: feature.background ?? [], background: undefined }));

  do {
    // We've tried enough, no more
    if (messages.length > 6 || runCount++ >= 10) {
      await controller.journal.error("Failed to generate feature; returning partial feature");
      break;
    }

    // Only include the `publish` tool when something has been generated
    const useTools = steps.length > feature.steps.length ? tools : undefined;

    // LLM generates new feature. Determine next steps
    const response = await generate(system, messages, { tools: useTools, model: 'medium', reasoningEffort: 'low' });
    if (!response) break;

    const { steps: responseSteps } = parseFeature(response);
    const nextSteps = deltaSteps(steps, responseSteps);

    if (nextSteps.length === 0) {
      console.warn("No new steps. Should have called `publish` tool")
      break;
    }

    const next = makeFeature({ name: 'continue', steps: nextSteps });

    // Validate if the result matches our Gherkin step definitions
    const { valid, steps: validatedSteps } = controller.validate(next);
    if (!valid) {
      messages.push(...invalidToMessages(response!, validatedSteps));
      continue;
    }

    // Run BDD steps
    const { page: nextPage, status, steps: runSteps, reason: runFailure } = await controller.run(next);

    steps.push(...runSteps.filter((s) => s.status === 'success').map(({text}) => text));

    // The run failed; try again
    if (status === 'failure') {
      messages.push(...failureToMessages(response!, runSteps, runFailure));
      continue;
    }

    // Success
    content = await describePage(nextPage, 'html');
    const assertSteps = await determineThenSteps(currentPage, nextPage, controller.journal);
    steps.push(...assertSteps);

    currentPage = nextPage;
    messages = [
      { role: 'assistant' as const, content: makeFeature({ ...feature, steps }) },
      { role: 'user' as const, content },
    ];
  } while (true);

  return { ...feature, steps, comment: undefined };
}
