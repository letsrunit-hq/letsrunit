import { generate } from '@letsrunit/ai';
import { Journal } from '@letsrunit/journal';
import * as Diff from 'diff';
import rehypeFormat from 'rehype-format';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';
import { scrubHtml } from '../utils/scrub-html';
import { locatorRules } from './locator-rules';

const PROMPT = `You analyze a diff of two HTML files. Your job is to detect the most significant user-visible changes and output up to 3 Playwright Gherkin steps using these step definitions only:

* Then I see {locator}
* Then I do not see {locator}
* Then I see that {locator} contains {locator}
* Then I see that {locator} not contains {locator}

Locator rules:
${locatorRules}

## Output

1. Significance order: added or removed visible elements, changed headings or button texts, added or removed list/table items or counters, other visible text changes.
2. Ignore purely structural changes that do not affect visibility.
3. Ignore changes in input field values
4. Generate 0 to 3 steps. If none, output: \`Then I do not see any changes\`.
5. For added elements use \`I see\`, for removed elements use \`I do not see\`. For added or removed child content under a stable parent, use \`contains\` or \`not contains\`.
6. Output only the steps, one per line, no explanations, no extra text, no code fences.

Examples:
Then I see button "Accept"
Then I do not see dialog with text "Introduction"
Then I see that \`span.count\` contains text "10 items"

**Now analyze and output the steps.**
`;

const DUMMY = 'Then I do not see any changes';

async function formatHtml(rawHtml: string, url: string) {
  const html = await scrubHtml({ html: rawHtml, url });

  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeFormat, { indent: 2 }) // collapses existing whitespace and formats nodes
    .use(rehypeStringify)
    .process(html);
  return String(file);
}

export async function unifiedHtmlDiff(
  old: { html: string; url: string },
  current: { html: string; url: string },
): Promise<string> {
  const [a, b] = await Promise.all([formatHtml(old.html, old.url), formatHtml(current.html, current.url)]);

  return Diff.createTwoFilesPatch('before.html', 'after.html', a, b);
}

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
