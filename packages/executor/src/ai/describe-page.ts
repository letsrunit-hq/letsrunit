import { scrubHtml } from '../utils/scrub-html';
import { stringify as toYaml } from 'yaml';
import { generate } from '@letsrunit/ai';
import { extractPageInfo } from '../utils/page-info';
import type { PageInfo } from '../types';

const PROMPT = `Convert raw HTML into compact Markdown using a limited set of custom blocks. The output feeds must be consistent.

## Block types

* \`::: section\`
* \`::: form\`
* \`::: grid\`
* \`::: nav\`
* \`::: pagination\`
* \`::: dialog\`

#### Example

\`\`\`
::: section {ui=footer}
© 2025 Acme Inc, All rights reserved.
:::
\`\`\`

#### Inside blocks

* Use basic Markdown: headings, bullets, links, images.
* Use longer fences to nest blocks, eg \`:::: form\` inside \`::: section\`.
* Prefer flat structure.

## UI hints

* Attach at block/item end: \`{key=value ...}\`
Common keys:
  * \`ui=header|footer|hero|sidenav|card|product-grid|actions|note|illustration|switch|calendar|button\`
  * \`variant=primary|secondary\`, \`size=sm|md|lg\`, \`text="..."\`
* Use only when visually meaningful. Don’t use UI hints for semantic structure.
* Use the UI hints consistently. All elements with the same look should have the same ui hint.

## Block guidance

**section** – Generic content: header, hero, footer, cards, FAQs, text.
**nav** – Navigation: list of links.
**form** – Grouped inputs.
**grid** – Product/post/gallery listings.
**dialog** – Modals, snackbars, cookie banners.

## Structure & tone

* Preserve author structure; no list/table normalization.
* Paragraphs stay paragraphs.
* Only bulletize true lists or repeated item patterns.
* Use concise language.
* Inline emphasis/links/images stay inline.
* Only include actionable components. Omit decoration.

## Forms

Inside \`::: form\`:

* List fields as bullets:
  \`\`\`
  * Label {ui=textbox}
  * Birth date {ui=calendar}
  * Toggle X {ui=switch}
  * Notes {ui=textarea}
  \`\`\`
* Submit button format:
  \`[Create] {ui=button variant=primary}\`

## Grids

* Add a markdown heading above the list if there's a header associated with the grid  
* Each item as a bullet:
  \`* [Product | €1.99](/product/123)\`
* Use additional hints like \`{ui=button ui:ribbon="Only 1 left"}\` when needed.

## Invalid patterns to avoid

* Don't render links without brackets:
  ❌ \`Product | €9.99 (/prod/42)\`
* Do use Markdown links:
  ✅ \`[Product](/prod/42)\`

## Final rules

✅ Markdown only.
❌ No HTML.
✅ Only listed blocks.
✅ Always convert \`<a>\` elements into markdown links.
`;

export async function describePage(
  page: { url: string, html: string, info?: PageInfo },
  contentType: 'markdown' | 'html' = 'markdown',
): Promise<string> {
  const info = page.info ?? await extractPageInfo(page);

  const html = await scrubHtml(page);
  const content = contentType === 'markdown' ? await generate(PROMPT, html, { model: 'medium' }) : html;

  return [
    '---',
    toYaml(info, { lineWidth: 0 }).trim(),
    '---',
    '',
    content
  ].join('\n');
}
