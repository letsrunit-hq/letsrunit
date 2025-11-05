import { Controller } from '@letsrunit/controller';
import { generate } from '@letsrunit/ai';
import { deltaSteps, type Feature, parseFeature, writeFeature } from '@letsrunit/gherkin';
import type { Snapshot } from '@letsrunit/playwright';
import { splitUrl } from '@letsrunit/utils';
import * as z from 'zod';
import { describePage } from './describe';

const PROMPT = `You're a QA tester, tasked with writing BDD tests in gherkin.

You output partial a Gherkin feature. The user will provide page content. You will write a new feature scenario.

The following steps are available:
{{#steps}}
  - {{.}}
{{/steps}}

# Customer parameter types:

* \`{locator}\` - Defines a target element (and optional scope) in natural language
* \`{foo|bar}\` - Choose one of the available options. Example: {foo|bar} → foo
* \`{keys}\` - A key or key combination (in double quotes). Examples: "A", "CTRL + S"
* \`{values}\` - A string (in double quotes) or number. Examples: "Hello", 10, -22.5

## \`{locator}\`

Structure:
  locator := withExpr ( "within" selector )*
  withExpr := selector ( ("with" | "without") predicate )*
  predicate := selector
  selector := \`raw\` | role | tag
  role := (button|link|field|image|text|IDENT) ["name"]?
  tag := IDENT
  "name" := visible text in quotes
  \`raw\` := a raw Playwright locator in backticks

Examples:
 - button "Submit"
 - field "Email"
 - section with text "Price"
 - button "Pay" within form #order
 - \`#checkout\`
 - \`css=.btn-primary >> nth(0)\`

# Output

Add one or more steps to accomplish the user story of the feature. Only add steps based on what's available on
this page.

Or call the tool 'publish' when the feature is done, as specified by the user.

Hints:
- Prefer readable locators, like \`field "Name"\` or \`switch "Approve"\` above raw Playwright locators
- Use \'link\' for an \`<a>\` element, even if displayed as button
- Do not add more \`When\` steps after clicking on a link for the current page
- Keep defaults unless specifically instructed otherwise.
- Ensure that a selector resolves to exactly one element to prevent a strict violation in Playwright
- **Do not** include raw parameter placeholders like \`{check|uncheck}\` in the output
- Use the Dutch locale for number and date formatting
`;

interface DetermineStoryOptions {
  controller: Controller;
  page: Snapshot & { content?: string };
  feature: Feature;
  appInfo?: {
    purpose: string;
    loginAvailable: boolean;
  }
}

export const tools = {
  publish: {
    description: "Publish the feature. Call this when the feature is completed. It's not possible to add steps" +
      " after publication",
    inputSchema: z.object({}),
  },
};

function sanitizeResponse(response: string) {
  return response.replace(/`raw=([^`]+)`/g, '`$1`');
}

export async function determineStory({ controller, page, feature }: DetermineStoryOptions) {
  const whenSteps = controller.listSteps('When');

  let runCount = 0;
  let content = page.content ?? await describePage(page, 'html');
  let currentUrl = page.url;

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
        continue: false,
        steps: whenSteps,
      },
    };

    const response = await generate(system, messages, { tools });
    if (!response) break;

    const sanitized = sanitizeResponse(response);

    const { steps: responseSteps } = parseFeature(sanitized);
    const newSteps = deltaSteps(steps, responseSteps);

    const next = writeFeature({ name: '', steps: newSteps });

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
}
