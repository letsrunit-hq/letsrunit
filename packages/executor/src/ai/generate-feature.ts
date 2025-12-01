import { generate } from '@letsrunit/ai';
import { getLang } from '@letsrunit/bdd/src/utils/get-lang';
import { Controller, Result as StepResult } from '@letsrunit/controller';
import { deltaSteps, type Feature, makeFeature, parseFeature } from '@letsrunit/gherkin';
import { Journal } from '@letsrunit/journal';
import type { Snapshot } from '@letsrunit/playwright';
import { splitUrl, statusSymbol } from '@letsrunit/utils';
import { ModelMessage, ToolSet } from 'ai';
import ISO6391 from 'iso-639-1';
import * as z from 'zod';
import type { Result } from '../types';
import { describePage } from './describe-page';
import { detectPageChanges } from './detect-page-changes';
import { locatorRules } from './locator-rules';

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
  page?: Snapshot & { content?: string; lang?: string };
  feature: Feature;
  appInfo?: {
    purpose: string;
    loginAvailable: boolean;
  };
}

export const tools: ToolSet = {
  publish: {
    description: 'Publish the feature.',
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

  return steps;
}

function invalidToMessages(
  feature: Feature | string,
  validatedSteps: { text: string; def?: string }[],
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

async function failureToMessages(feature: Feature | string, result: StepResult): Promise<ModelMessage[]> {
  const userMessage = [
    ...result.steps.map((s) => `${statusSymbol(s.status)} ${s.text}`),
    '',
    result.reason,
    '',
    '---',
    '',
    await describePage(result.page, 'html'),
  ].join('\n');

  return [
    { role: 'assistant', content: typeof feature === 'string' ? feature : makeFeature(feature) },
    { role: 'user', content: userMessage },
  ];
}

export async function generateFeature({ controller, feature }: Options): Promise<Result> {
  const whenSteps = controller.listSteps('When');

  const { page } = await controller.run(
    makeFeature({ ...feature, steps: feature.background ?? [], background: undefined }),
  );

  let runCount = 0;
  let content = await describePage(page, 'html');
  let currentPage = page;

  const lang = await getLang(page);
  const language = lang && (ISO6391.getName(lang.substring(0, 2)) || lang);

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

  do {
    // We've tried enough, no more
    if (messages.length > 6 || runCount++ >= 10) {
      await controller.journal.error('Failed to generate feature; returning partial feature');
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
      // TODO: Use AI to check if the feature is indeed complete. If not, force new steps.
      console.warn('No new steps. Should have called `publish` tool');
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
    const result = await controller.run(next);
    const { page: nextPage, status, steps: runSteps } = result;

    steps.push(...runSteps.filter((s) => s.status === 'success').map(({ text }) => text));

    // The run failed; try again
    if (status === 'failed') {
      messages.push(...(await failureToMessages(response!, result)));
      continue;
    }

    // Success
    content = await describePage(nextPage, 'html');

    const assertSteps = await determineThenSteps(currentPage, nextPage, controller.journal);
    await controller.run(makeFeature({ name: 'assert', steps: assertSteps }));
    steps.push(...assertSteps);

    currentPage = nextPage;
    messages = [
      { role: 'assistant' as const, content: makeFeature({ ...feature, steps }) },
      { role: 'user' as const, content },
    ];
  } while (true);

  return { status: 'passed', feature: { ...feature, steps, comments: undefined } };
}
