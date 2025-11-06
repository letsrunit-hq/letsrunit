import { Controller } from '@letsrunit/controller';
import { generate } from '@letsrunit/ai';
import { deltaSteps, type Feature, parseFeature, writeFeature } from '@letsrunit/gherkin';
import type { Snapshot } from '@letsrunit/playwright';
import { splitUrl } from '@letsrunit/utils';
import * as z from 'zod';
import type { ToolSet } from 'ai';
import { describePage } from './describe-page';
import ISO6391 from 'iso-639-1';

const PROMPT = `You're a QA tester, tasked with writing BDD tests in Gherkin format for a feature.

You will receive the page content from the user. Your job is to:
- Incrementally add \`When\` steps to complete a **single Gherkin scenario**.
- End the process by calling \`publish()\` once the scenario is fully satisfied.

## Completion Criteria

Only call \`publish()\` if the **user goal has been met**, based on the scenario description. You must:
1. Verify that all actions required to achieve the user story are complete.
2. Confirm the presence of a final UI state (e.g. confirmation message, generated link, visible output).

**If these conditions are not met, do NOT call \`publish()\` yet. Continue adding relevant \`When\` steps.**

## Allowed \`When\` Steps:

Only use the following \`When\` steps:
  - When I {check} {locator}
  - When I clear {locator}
  - When I fill {locator} with {value}
  - When I {focus} {locator}
  - When I select {string} in {locator}
  - When I type {string} into {locator}
  - When I press {keys}
  - When I {click} {locator}
  - When I {click} {locator} while holding {keys}
  - When I scroll {locator} into view

## Parameters

* \`{locator}\` - A readable description of a page element
* \`{keys}\` - Keyboard input like "Enter" or "CTRL + S"
* \`{value}\` - A string or number like "Hello", 10

Locator rules:
- Prefer descriptive locators like \`field "Email"\` or \`button "Create invitation"\` over raw selectors.
- Use \`link\` for \`<a>\` tags, even if styled as buttons.
- Do not use ambiguous or overly broad selectors.
- Ensure selectors are unambiguous and match exactly one element.

## Workflow

The interaction follows this loop:

assistant: Gherkin feature
user: HTML page snapshot
assistant: add new \`When\` steps if needed
user: more HTML (or no change)
assistant: continue or call \`publish()\` if scenario goal is met

Do not add \`Given\` or \`Then\` steps.

📌 **Special Rules**:
- Do not add further steps once a \`link\` is clicked (indicating page navigation).
{{#language}}- Use the {{language}} locale for number and date formatting{{/language}}

📌 **Example Completion Criteria**:
For a feature like "Create a personal newborn visit invitation and booking page", ensure:
- The form is filled
- A button is clicked to generate the page
- A shareable link is visible on screen
Only then may you call \`publish()\`.

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
    execute: () => {
      return 'done';
    }
  },
};

function sanitizeResponse(response: string) {
  return response.replace(/`raw=([^`]+)`/g, '`$1`');
}

export async function generateFeature({ controller, page, feature }: Options): Promise<Feature> {
  const whenSteps = controller.listSteps('When');

  let runCount = 0;
  let content = page.content ?? await describePage(page, 'html');
  let currentUrl = page.url;
  const language = page.lang && (ISO6391.getName(page.lang.substring(0, 2)) || page.lang);

  const steps = [...feature.steps];

  await controller.run(writeFeature(feature));

  do {
    const messages = [
      { role: 'assistant' as const, content: writeFeature({ ...feature, steps }) },
      { role: 'user' as const, content },
    ];

    const system = {
      template: PROMPT,
      vars: {
        steps: whenSteps,
        language,
      },
    };

    const response = await generate(system, messages, { tools, model: 'medium', reasoningEffort: 'low' });
    if (!response) break;

    const sanitized = sanitizeResponse(response);

    const { steps: responseSteps } = parseFeature(sanitized);
    const newSteps = deltaSteps(steps, responseSteps);
    if (newSteps.length === 0) {
      console.warn("No new steps. Should have called `publish` tool")
      break;
    }

    const next = writeFeature({ steps: newSteps });

    const { page: nextPage } = await controller.run(next);
    content = await describePage(nextPage, 'html');

    if (nextPage.url !== currentUrl) {
      const { path } = splitUrl(nextPage.url);
      newSteps.push(`Then I should be on page "${path}"`);
      currentUrl = nextPage.url;
    } else {
      // TODO: Determine if something significant has changed on the page.
    }

    steps.push(...newSteps);
    runCount++;
  } while (true);

  return { ...feature, steps, comment: undefined };
}
