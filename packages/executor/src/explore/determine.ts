import { Controller, type Snapshot } from '@letsrunit/controller';
import { generate } from '@letsrunit/ai';
import { deltaSteps, type Feature, parseFeature, writeFeature } from '@letsrunit/gherkin';
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

function sanitizeResponse(response: string) {
  return response.replace(/`raw=([^`]+)`/g, '`$1`');
}

export async function determineStory({ controller, page, feature }: DetermineStoryOptions) {
  const whenSteps = controller.listSteps('When');
  const thenSteps = [] as string[];//controller.listSteps('Then');

  let runCount = 0;
  let content = page.content ?? await describePage(page, 'html');

  const steps = [...feature.steps];
  console.log(writeFeature({ ...feature, steps }));

  do {
    const messages = [
      { role: 'assistant' as const, content: writeFeature({ ...feature, steps }) },
      { role: 'user' as const, content },
    ];

    const system = {
      template: PROMPT,
      vars: {
        continue: false,
        steps: [...whenSteps, ...thenSteps],
      },
    };

    const response = await generate(system, messages);
    const sanitized = sanitizeResponse(response);

    const { steps: responseSteps } = parseFeature(sanitized);
    const newSteps = deltaSteps(steps, responseSteps);

    const next = writeFeature({ name: 'Continue', steps: newSteps });
    console.log(next);

    const { page: nextPage } = await controller.run(next);
    content = await describePage(nextPage, 'html');

    steps.push(...newSteps);
    runCount++;
  } while (steps[steps.length - 1].trim().toLowerCase() !== "then i'm done");
}
