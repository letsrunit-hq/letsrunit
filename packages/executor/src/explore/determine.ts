import { Controller, Snapshot } from '@letsrunit/controller';
import { generate } from '@letsrunit/ai';
import { deltaSteps, parseFeature, writeFeature } from '../utils/feature';
import { describePage } from './describe';

const PROMPT = `You're a QA tester, tasked with writing BDD tests in gherkin.

You output partial a Gherkin feature. The user will provide page content. You will write a new feature scenario.

In this order:
 1. Add a \`Then\` step asserting the change (optional).
 2. Add one or more \`When\` steps to perform the next actions.

The following steps are available:
{steps}

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
  selector := \`raw\` | role[#id]? | tag[#id]? | #id
  role := (button|link|field|image|text|IDENT) ["name"]?
  tag := IDENT
  #id := "#" IDENT
  "name" := visible text in quotes
  \`raw\` := a raw Playwright locator in backticks

Examples:
 - button "Submit"
 - field "Email"
 - section with text "Price"
 - #checkout
 - button "Pay" within form #order
 - \`css=.btn-primary >> nth(0)\`

# Output

Add one or more steps to accomplish the user story of the feature. Only add steps based on what's available on
this page.

Hints:
- Prefer readable locators, like \`field "Name"\` above raw Playwright locators
- Use \'link\' for an \`<a>\` element, even if displayed as button
- Fill an \`<input>\` and not the surrounding \`<span>\` or \`<div>\`
- By default fill all required fields when filling out a form. If no fields are marked as required, assume all are required.
`;

interface DetermineStoryOptions {
  controller: Controller;
  page: Snapshot & { content?: string };
  feature: {
    name: string;
    description?: string;
    steps: string[];
  }
  appInfo?: {
    purpose: string;
    loginAvailable: boolean;
  }
}

export async function determineStory({ controller, page, feature, appInfo }: DetermineStoryOptions) {
  const stepDefinitions = controller.listSteps().filter((s) => !s.startsWith('Given'));
  const system = PROMPT.replace('{steps}', stepDefinitions.map((s) => ` - ${s}`).join("\n"));
  let content = page.content ?? await describePage(page, 'html');

  const steps = [...feature.steps];
  console.log(writeFeature(feature.name, feature.description, steps));

  do {
    const messages = [
      { role: 'assistant' as const, content: writeFeature(feature.name, feature.description, steps) },
      { role: 'user' as const, content },
    ]

    const response = await generate(system, messages);
    const { steps: responseSteps } = parseFeature(response);
    const newSteps = deltaSteps(steps, responseSteps);

    if (newSteps.length === 0) break;

    const next = writeFeature('Continue', '', newSteps);
    console.log(next);

    const nextPage = await controller.run(next);
    content = await describePage(nextPage, 'html');

    steps.push(...newSteps);
  } while (true);
}
