import { generate } from '@letsrunit/ai';
import { Journal } from '@letsrunit/journal';
import { unifiedHtmlDiff } from '../../../playwright/src/unified-html-diff';
import { locatorRules } from './locator-rules';

const PROMPT = `You analyze a diff of two HTML files. Your task is to detect the most significant user-visible changes and output 0 to 3 Playwright Gherkin steps using only these step definitions:

* Then I see {locator}
* Then I do not see {locator}
* Then I see that {locator} contains {locator}
* Then I see that {locator} not contains {locator}

Locator rules:
${locatorRules}

**Rules:**

1. Prioritize in this order:
   a. Added or removed visible elements
   b. Changed headings or button text
   c. Added or removed list/table items or counters
   d. Other visible text changes

2. Ignore:
   * Structural or visual-only changes (e.g. spans, ripples, icons, animations)
   * Changes in input field values
   * Hidden elements, screen-reader-only content, or tooltips
   * Removed notifications — only generate steps for newly added visible ones

3. Use:
   * \`I see\` for added elements
   * \`I do not see\` for removed elements
   * \`contains\` / \`not contains\` for changed child content under a stable parent

4. If no significant visible changes, output:
   \`Then I do not see any changes\`

5. Output format:
   * One step per line
   * No extra text, explanations, or code blocks

**Examples:**

Then I see button "Accept"
Then I do not see dialog with text "Introduction"
Then I see that span.count contains text "10 items"

---

Now analyze the diff and output the steps.
`;

const DUMMY = 'Then I do not see any changes';

export async function detectPageChanges(
  old: { html: string; url: string },
  current: { html: string; url: string },
  { journal }: { journal?: Journal } = {},
): Promise<string[]> {
  const diff = await unifiedHtmlDiff(old, current);
  journal?.debug(diff);

  const response = await generate(PROMPT, diff, { model: 'medium' });
  const steps = response.trim();

  return steps.toLowerCase() === DUMMY.toLowerCase() ? [] : steps.split('\n');
}
