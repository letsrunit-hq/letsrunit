// Conservatively scrub HTML for LLMs while preserving semantics.
// - Keeps structural tags (header/nav/main/section/article/aside/footer, headings, lists, tables, forms, etc.)
// - Removes <head>, <script>, <style>, <template>, <noscript>, comments
// - Drops nodes that are clearly hidden/inert via attributes (hidden, aria-hidden="true", display:none, visibility:hidden, opacity:0)
// - Strips event handlers (on*) and inline styles, keeps semantic attrs (id, class, role, aria-*, data-*, href, src, alt, etc.)
// - Collapses whitespace in text nodes (but NOT inside <pre>/<code>)
// - Does NOT change tag names, does NOT unwrap containers, does NOT reorder content

import { memoize } from '@letsrunit/utils/src/memoize';
import type { Page } from '@playwright/test';
import stringify from 'fast-json-stable-stringify';
import { JSDOM } from 'jsdom';
import { isPage } from './utils/type-check';

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
  cacheKey: (args) => stringify({ html: args[0].html, url: args[0].url, ...args[1] }),
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

  if (o.pickMain) pickMain(doc);
  dropInfraAndSvg(doc, !!o.dropSvg);
  if (o.dropHidden) dropHiddenTrees(doc);
  if (o.stripAttributes) stripAttributesAndSanitize(doc, o.stripAttributes);
  if (o.dropComments) dropHtmlComments(doc);
  if (o.replaceBrInHeadings) replaceBrsInHeadings(doc);
  if (o.limitLists >= 0) limitListsAndRows(doc, o.limitLists);
  if (o.normalizeWhitespace) normalizeWhitespace(doc.body);

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

// Split-out helper steps (top-level, no nested functions)

function pickMain(doc: Document): boolean {
  const main = doc.querySelector('main');
  if (!main) return false;
  const clone = main.cloneNode(true);
  doc.body.innerHTML = '';
  doc.body.appendChild(clone);
  return true;
}

function dropInfraAndSvg(doc: Document, dropSvg: boolean) {
  const toDrop = [...ALWAYS_DROP, dropSvg ? 'svg' : ''].filter(Boolean).join(',');
  if (!toDrop) return;
  doc.querySelectorAll(toDrop).forEach((el) => el.remove());
}

function dropHiddenTrees(doc: Document) {
  doc.querySelectorAll<HTMLElement>(HIDDEN_SELECTORS).forEach((el) => el.remove());
  const all = [...doc.body.querySelectorAll<HTMLElement>('*')];
  for (const el of all) {
    if (!el.isConnected) continue;
    if (hasHiddenAncestor(el)) el.remove();
  }
}

function stripAttributesAndSanitize(doc: Document, level: 0 | 1 | 2) {
  if (!level) return;

  const all = [...doc.body.querySelectorAll<HTMLElement>('*')];

  for (const el of all) {
    const isSvg = el.namespaceURI === 'http://www.w3.org/2000/svg';
    for (const { name } of [...el.attributes]) {
      const lower = name.toLowerCase();
      if (lower.startsWith('on')) {
        el.removeAttribute(name);
        continue;
      }
      if (lower === 'style') {
        el.removeAttribute(name);
        continue;
      }
      if (isSvg) continue; // keep svg attrs
      const allowed = level === 1 ? ALLOWED_ATTRS : ALLOWED_ATTRS_AGGRESSIVE;
      if (!allowed.match.has(lower) && !allowed.regexp?.test(name)) {
        el.removeAttribute(name);
      }
    }
  }

  // sanitize javascript: hrefs
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (/^\s*javascript:/i.test(href)) a.removeAttribute('href');
  });
}

function dropHtmlComments(doc: Document) {
  const nf = doc.defaultView?.NodeFilter;
  const SHOW_COMMENT = nf?.SHOW_COMMENT ?? 128; // fallback constant

  // createTreeWalker expects a NodeFilter mask
  const walker = doc.createTreeWalker(doc, SHOW_COMMENT as unknown as number);
  const toRemove: Comment[] = [];
  let n: Comment | null;

  while ((n = walker.nextNode() as Comment | null)) toRemove.push(n);
  toRemove.forEach((c) => c.parentNode?.removeChild(c));
}

function replaceBrsInHeadings(doc: Document) {
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    h.querySelectorAll('br').forEach((br) => {
      const space = doc.createTextNode(' ');
      (br as Element).replaceWith(space);
    });
  });
}

function limitListsAndRows(doc: Document, limit: number) {
  // lists
  doc.querySelectorAll('ul, ol').forEach((list) => {
    const items = Array.from(list.children).filter((c) => c.tagName === 'LI');
    for (let i = limit; i < items.length; i++) items[i].remove();
  });

  // table rows
  const rowContainers = doc.querySelectorAll('table, thead, tbody, tfoot');
  rowContainers.forEach((container) => {
    const rows = Array.from(container.children).filter((c) => c.tagName === 'TR');
    for (let i = limit; i < rows.length; i++) rows[i].remove();
  });
}
