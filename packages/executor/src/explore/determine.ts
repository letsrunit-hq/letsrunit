import { Controller, Snapshot } from '@letsrunit/controller';
import { generate } from '@letsrunit/ai';
import { writeFeature } from '../utils/feature';

const PROMPT = `You're a QA tester, tasked with writing BDD tests in gherkin.

You output partial a Gherkin feature. The user will provide page content. You will write a new feature scenario.

For now, only focus on the \`When\` steps. The following steps are available:
{steps}

# Customer parameter types:

* \`{locator}\` - Defines a target element (and optional scope) in natural language
* \`{foo|bar}\` - Choose one of the available options.
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
`;

interface DetermineStoryOptions {
  controller: Controller;
  page: Snapshot & { content?: string };
  feature: string;
  appInfo?: {
    purpose: string;
    loginAvailable: boolean;
  }
}

export async function determineStory({ controller, page, feature, appInfo }: DetermineStoryOptions) {
  const system = PROMPT.replace('{steps}', controller.listSteps('When').map((s) => ` - ${s}`).join("\n"));
  console.log(system);
  console.log(feature);

  do {
    const messages = [
      { role: 'assistant' as const, content: feature },
      { role: 'user' as const, content: page.content! },
    ]

    const response = await generate(system, messages);
    const newSteps = response.split('\n').map((s) => s.trim());

    if (newSteps.length === 0) break;

    const next = writeFeature('Continue', newSteps);
    console.log(next);

    await controller.run(next);
  } while (true);
}
