// Conservatively scrub HTML for LLMs while preserving semantics.
// - Keeps structural tags (header/nav/main/section/article/aside/footer, headings, lists, tables, forms, etc.)
// - Removes <head>, <script>, <style>, <template>, <noscript>, comments
// - Drops nodes that are clearly hidden/inert via attributes (hidden, aria-hidden="true", display:none, visibility:hidden, opacity:0)
// - Strips event handlers (on*) and inline styles, keeps semantic attrs (id, class, role, aria-*, data-*, href, src, alt, etc.)
// - Collapses whitespace in text nodes (but NOT inside <pre>/<code>)
// - Does NOT change tag names, does NOT unwrap containers, does NOT reorder content

import { hash } from '@letsrunit/utils';
import { memoize } from '@letsrunit/utils/src/memoize';
import type { Page } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { isPage } from './type-check';

export type ScrubHtmlOptions = {
  /** Remove nodes that look hidden/inert by attributes. Default: true */
  dropHidden?: boolean;
  /** Remove the entire <head>. Default: true */
  dropHead?: boolean;
  /** Remove <svg> glyphs. Default: false */
  dropSvg?: boolean;
  /** Only keep <main> element. Default: false */
  pickMain?: boolean;
  /** Keep a conservative attribute allowlist (0=none, 1=normal, 2=aggressive). Default: 1 */
  stripAttributes?: 0 | 1 | 2;
  /** Normalize whitespace in text nodes (outside pre/code). Default: true */
  normalizeWhitespace?: boolean;
  /** Remove HTML comments. Default: true */
  dropComments?: boolean;
  /** Replace <br> within headings (h1–h6) with a space. Default: true */
  replaceBrInHeadings?: boolean;
  /** Limit lists to max items: -1 mean no limit. Default: -1 */
  limitLists?: number;
};

const HTML_MIN_ATTR_THRESHOLD = 250_000;    // ~70k tokens
const HTML_LIMIT_LISTS_THRESHOLD = 400_000; // ~110k tokens
const HTML_MAIN_ONLY_THRESHOLD = 600_000;   // ~170k tokens

function getDefaults(contentLength: number): Required<ScrubHtmlOptions> {
  return {
    dropHidden: true,
    dropHead: true,
    dropSvg: false,
    pickMain: contentLength >= HTML_MAIN_ONLY_THRESHOLD,
    stripAttributes: contentLength >= HTML_MIN_ATTR_THRESHOLD ? 2 : 1,
    normalizeWhitespace: true,
    dropComments: true,
    replaceBrInHeadings: true,
    limitLists: contentLength >= HTML_LIMIT_LISTS_THRESHOLD ? 20 : -1,
  };
}

// Attributes we keep to preserve semantics and minimal usefulness
const ALLOWED_ATTRS = {
  match: new Set([
    // identity/semantics
    'id',
    'class',
    'role',
    // internationalization
    'lang',
    'dir',

    // anchors & media
    'href',
    'title',
    'target',
    'rel',
    'src',
    'alt',
    'width',
    'height',
    'loading',

    // tables
    'scope',
    'headers',
    'colspan',
    'rowspan',

    // forms (pure semantics—doesn’t change structure)
    'name',
    'value',
    'type',
    'for',
    'placeholder',
    'checked',
    'selected',
    'multiple',
    'method',
    'action',

    // time, figure, etc.
    'datetime',
  ]),
  regexp:/^aria-[\w-]+|^data-[\w-]+$/i, // ARIA attributes & data-* attributes
};

const ALLOWED_ATTRS_AGGRESSIVE = {
  match: new Set([
    // structuur / algemene selectors
    'id',
    'class',
    'role',

    // links / media
    'href',
    'src',
    'alt',
    'title',

    // tables
    'scope',

    // forms / velden
    'name',
    'type',
    'for',
    'placeholder',
    'value',
    'checked',
    'selected',

    // ARIA voor Playwright getByRole/getByLabel
    'aria-label',
    'aria-labelledby',
    'aria-describedby',

    // veelgebruikte test selectors
    'data-testid',
    'data-test-id',
    'data-cy',
    'data-qa',
  ]),
  regexp: null,
};

const HIDDEN_SELECTORS = [
  '[hidden]',
  '[inert]',
  '[aria-hidden="true"]',
  '[style*="display:none"]',
  '[style*="visibility:hidden"]',
  '[style*="opacity:0"]'
].join(',');

// Tags that are always removed (infra/noise)
const ALWAYS_DROP = [
  'script', 'style', 'template', 'noscript', 'slot', 'object', 'embed'
];

export async function scrubHtml(
  page: { html: string, url: string } | Page,
  opts: ScrubHtmlOptions = {},
): Promise<string> {
  if (isPage(page)) page = { html: await page.content(), url: page.url() };
  return await memoizedScrubHtml(page, opts);
}

const memoizedScrubHtml = memoize(realScrubHtml, {
  max: 16,
  ttl: 10 * 60_000,
  cacheKey: (args) => hash({ html: args[0].html, url: args[0].url, ...args[1] }),
});

/**
 * Scrub HTML conservatively for LLMs without destroying semantics.
 */
export async function realScrubHtml(
  { html, url }: { html: string, url: string },
  opts: ScrubHtmlOptions = {},
): Promise<string> {
  const o = { ...getDefaults(html.length), ...opts };

  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // 1) Optionally pick only the first <main> element
  let pickedMain = false;
  if (o.pickMain) {
    const main = doc.querySelector('main');
    if (main) {
      const clone = main.cloneNode(true);
      doc.body.innerHTML = '';
      doc.body.appendChild(clone);
      pickedMain = true;
    }
  }

  // 2) Optionally remove <head>
  if (o.dropHead && !pickedMain) {
    const head = doc.querySelector('head');
    if (head) head.remove();
  }

  // 3) Remove infra/noise elements (but leave SVG unless asked)
  const toDrop = [...ALWAYS_DROP, o.dropSvg ? 'svg' : ''].filter(Boolean).join(',');
  if (toDrop) doc.querySelectorAll(toDrop).forEach((el) => el.remove());

  // 4) Drop clearly hidden/inert nodes (attribute-based only, no layout assumptions)
  if (o.dropHidden) {
    // Remove any node that matches hidden selectors OR has a hidden ancestor
    doc.querySelectorAll<HTMLElement>(HIDDEN_SELECTORS).forEach((el) => el.remove());

    // Also remove subtrees whose ancestors carry hidden markers (cheap ancestor scan)
    // We do a second pass: if any ancestor has hidden attrs, drop the node.
    const all = [...doc.body.querySelectorAll<HTMLElement>('*')];
    for (const el of all) {
      if (!el.isConnected) continue;
      if (hasHiddenAncestor(el)) el.remove();
    }
  }

  // 5) Strip event handlers + non-allowed attributes, keep semantics
  if (o.stripAttributes) {
    const all = [...doc.body.querySelectorAll<HTMLElement>('*')];
    for (const el of all) {
      const isSvg = el.namespaceURI === 'http://www.w3.org/2000/svg';
      // Iterate over a copy because we'll mutate attributes
      for (const { name } of [...el.attributes]) {
        const lower = name.toLowerCase();
        if (lower.startsWith('on')) {
          // Remove event handler attributes
          el.removeAttribute(name);
          continue;
        }
        if (lower === 'style') {
          // Remove inline styles to save tokens (we already used style for hidden detection)
          el.removeAttribute(name);
          continue;
        }

        // Do not aggressively filter SVG attributes—keep them for glyph integrity
        if (isSvg) continue;

        const allowedAttrs = o.stripAttributes === 1 ? ALLOWED_ATTRS : ALLOWED_ATTRS_AGGRESSIVE;

        // Remove all attributes not in allow list
        if (!allowedAttrs.match.has(lower) && !allowedAttrs.regexp?.test(name)) {
          el.removeAttribute(name);
        }
      }
    }

    // Also sanitize <a href="javascript:..."> (keep tag, drop href)
    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (/^\s*javascript:/i.test(href)) a.removeAttribute('href');
    });
  }

  // 6) Remove comments
  if (o.dropComments) {
    const walker = doc.createTreeWalker(doc, dom.window.NodeFilter.SHOW_COMMENT);
    const toRemove: Comment[] = [];
    let n: Comment | null;

    while ((n = walker.nextNode() as Comment | null)) toRemove.push(n);
    toRemove.forEach((c) => c.parentNode?.removeChild(c));
  }

  // 7) Replace <br> inside headings (h1–h6) with a space to keep words together
  // This runs before whitespace normalization so spaces are later collapsed/trimmed appropriately.
  if (o.replaceBrInHeadings) {
    doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      h.querySelectorAll('br').forEach((br) => {
        const space = doc.createTextNode(' ');
        (br as Element).replaceWith(space);
      });
    });
  }

  // 8) Limit lists and table rows, if requested
  if (typeof o.limitLists === 'number' && o.limitLists > -1) {
    const limit = o.limitLists;

    // Limit list items for each list separately
    doc.querySelectorAll('ul, ol').forEach((list) => {
      // Only consider direct LI children to avoid double-trimming nested lists
      const items = Array.from(list.children).filter((c) => c.tagName === 'LI');
      for (let i = limit; i < items.length; i++) {
        items[i].remove();
      }
    });

    // Limit table rows: consider table sections and tables with direct TR children
    const rowContainers = doc.querySelectorAll('table, thead, tbody, tfoot');
    rowContainers.forEach((container) => {
      const rows = Array.from(container.children).filter((c) => c.tagName === 'TR');
      for (let i = limit; i < rows.length; i++) {
        rows[i].remove();
      }
    });
  }

  // 9) Normalize whitespace in text nodes (but not inside pre/code)
  if (o.normalizeWhitespace) {
    normalizeWhitespace(doc.body);
  }

  // Return the body’s innerHTML (structure intact, tags preserved)
  return doc.body.innerHTML;
}

/* ---------------- helpers ---------------- */

function hasHiddenAncestor(el: Element): boolean {
  let p: Element | null = el.parentElement;
  while (p) {
    if (
      p.hasAttribute('hidden') ||
      p.hasAttribute('inert') ||
      p.getAttribute('aria-hidden') === 'true'
    ) return true;

    const style = p.getAttribute('style') || '';
    if (/\bdisplay\s*:\s*none\b/i.test(style)) return true;
    if (/\bvisibility\s*:\s*hidden\b/i.test(style)) return true;
    if (/\bopacity\s*:\s*0(?:\D|$)/i.test(style)) return true;

    p = p.parentElement;
  }
  return false;
}

function normalizeWhitespace(root: Element) {
  const preLike = new Set(['PRE', 'CODE', 'SAMP', 'KBD']);
  const doc = root.ownerDocument!;
  const walker = doc.createTreeWalker(root, 4 /*NodeFilter.SHOW_TEXT*/);
  const changes: Text[] = [];

  let node: Node | null;

  while ((node = walker.nextNode())) {
    const text = node as Text;
    const parent = text.parentElement;
    if (!parent) continue;
    if (preLike.has(parent.tagName)) continue; // don't touch pre/code

    const v = text.nodeValue ?? '';
    const collapsed = v.replace(/\s+/g, ' ');
    if (collapsed !== v) changes.push(text);
  }
  for (const t of changes) {
    // extra trim around block-ish elements
    const parent = t.parentElement!;
    const isBlockish = /^(P|LI|DIV|SECTION|ARTICLE|ASIDE|HEADER|FOOTER|MAIN|NAV|H[1-6]|BLOCKQUOTE|FIGCAPTION|TD|TH)$/i.test(parent.tagName);
    t.nodeValue = (t.nodeValue || '').replace(/\s+/g, ' ');
    if (isBlockish) t.nodeValue = (t.nodeValue || '').trim();
  }
}
