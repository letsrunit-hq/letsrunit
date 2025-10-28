import { scrubHtml } from '../utils/scrub-html';
import { stringify as toYaml } from 'yaml';
import type { PageInfo } from '../types';
import { generate } from '@letsrunit/ai';

import metascraper, { MetascraperOptions } from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLogo from 'metascraper-logo';
import metascraperLogoFavicon from 'metascraper-logo-favicon';
import metascraperLang from 'metascraper-lang';
import metascraperUrl from 'metascraper-url';

const scrape = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperLogoFavicon(),
  metascraperLang(),
  metascraperUrl(),
]);

const PROMPT = `Convert raw HTML into compact Markdown using a limited set of custom blocks and Playwright selectors. The output feeds agents for Playwright and must be consistent.

---

### Block types

* \`::: section\`
* \`::: form\`
* \`::: grid\`
* \`::: nav\`
* \`::: pagination\`
* \`::: dialog\`

Format: \`::: block [(playwright selector)] {optional ui hints}\`

Inside blocks:

* Use basic Markdown: headings, bullets, links, images.
* Prefer flat structure. Nest only when necessary (longer fences).

---

### Selectors

* Add selectors in square brackets immediately after their elements: \`[(role=button)]\`, \`[(css=#email)]\`.
* Use one concise selector per interactive element (buttons, inputs, etc).
* Prefer roles:
  * \`role=button\`, \`role=textbox\`, \`role=combobox\`, \`role=switch\`, \`role=menu\`, \`role=dialog\`, \`role=heading[level=N]\`.
* Don’t include \`name="..."\` unless strictly needed.
* Do not use \`role=link\` for \`<a href>\`.
* Never assign \`role=button\` to \`<a>\` unless it has that role in HTML.
* Use CSS only if:
  * Stable \`id\`/attr (\`#id\`, \`[data-testid=...]\`, \`[aria-label=...]\`).
  * Disambiguation is needed.
* Avoid utility classes, XPath, and \`nth\` unless unavoidable.

---

### UI hints

* Attach at block/item end: \`{key=value ...}\`
Common keys:
  * \`ui=header|footer|hero|sidenav|card|product-grid|actions|note|illustration|switch|calendar|button\`
  * \`variant=primary|secondary\`, \`size=sm|md|lg\`, \`text="..."\`
* Use only when visually meaningful. Don’t use UI hints for semantic structure.

---

### Block guidance

**section** – Generic content: header, hero, footer, cards, FAQs, text.
**nav** – Navigation: list of links.
**form** – Grouped inputs.
**grid** – Product/post/gallery listings.
**dialog** – Modals, snackbars, cookie banners.

---

### Structure & tone

* Preserve author structure; no list/table normalization.
* Paragraphs stay paragraphs.
* Only bulletize true lists or repeated item patterns.
* Use concise language.
* Inline emphasis/links/images stay inline.
* Only include actionable components. Omit decoration.

---

### Forms

Inside \`::: form\`:

* List fields as bullets:
  \`\`\`
  * Label [(role=textbox)]
  * Birth date [(role=combobox)] {ui=calendar}
  * Toggle X [(role=switch)]
  * Notes [(role=textbox)] {ui=textarea}
  \`\`\`
* Use roles only for selectors.
* Submit button format:
  \`[Create] [(role=button)] {ui=button variant=primary}\`

---

### Grids

* Each item as a bullet:
  \`* Product | €1.99 [(role=button)]\`
* Use \`{ui=ribbon text="Only 1 left"}\` when needed.
* If item is a link: \`[Label](/link)\`

---

### Invalid patterns to avoid

* Don't render links without brackets:
  ❌ \`Product | €9.99 (/prod/42)\`
* Don’t use locator-only for links:
  ❌ \`Product [(css=a[href="/prod/42"])]\`
* Do use Markdown links:
  ✅ \`[Product](/prod/42)\`

---

### Ambiguity

* For duplicate roles, pick nearest stable attr.
* Omit hidden/invisible elements.
* Skip purely decorative items.
* Omit large/mega footers.

---

### Final rules

* Markdown only.
* No HTML.
* Only listed blocks.
* One selector per item.
* One block-level selector per block.
* Never use locator for an \`href\`.
`;

async function extractPageInfo(options: MetascraperOptions): Promise<PageInfo> {
  const meta = await scrape(options);

  return {
    url: meta.url || options.url,
    title: meta.title || undefined,
    description: meta.description || undefined,
    image: meta.image || undefined,
    favicon: meta.logo || undefined,
    lang: meta.lang || undefined,
  };
}

export async function describePage(
  page: { url: string, html: string },
  contentType: 'markdown' | 'html' = 'markdown',
): Promise<string> {
  const info = await extractPageInfo(page);

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
