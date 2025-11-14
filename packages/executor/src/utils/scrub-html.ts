// Conservatively scrub HTML for LLMs while preserving semantics.
// - Keeps structural tags (header/nav/main/section/article/aside/footer, headings, lists, tables, forms, etc.)
// - Removes <head>, <script>, <style>, <template>, <noscript>, comments
// - Drops nodes that are clearly hidden/inert via attributes (hidden, aria-hidden="true", display:none, visibility:hidden, opacity:0)
// - Strips event handlers (on*) and inline styles, keeps semantic attrs (id, class, role, aria-*, data-*, href, src, alt, etc.)
// - Collapses whitespace in text nodes (but NOT inside <pre>/<code>)
// - Does NOT change tag names, does NOT unwrap containers, does NOT reorder content

import { JSDOM } from 'jsdom';

export type SemanticScrubOptions = {
  /** Remove nodes that look hidden/inert by attributes. Default: true */
  dropHidden?: boolean;
  /** Remove the entire <head>. Default: true */
  dropHead?: boolean;
  /** Remove <svg> glyphs. Default: false (kept; change to true to save tokens further) */
  dropSvg?: boolean;
  /** Keep a conservative attribute allowlist. Default: true */
  stripAttributes?: boolean;
  /** Normalize whitespace in text nodes (outside pre/code). Default: true */
  normalizeWhitespace?: boolean;
  /** Remove HTML comments. Default: true */
  dropComments?: boolean;
  /** Replace <br> within headings (h1–h6) with a space. Default: true */
  replaceBrInHeadings?: boolean;
};

const DEFAULTS: Required<SemanticScrubOptions> = {
  dropHidden: true,
  dropHead: true,
  dropSvg: false,
  stripAttributes: true,
  normalizeWhitespace: true,
  dropComments: true,
  replaceBrInHeadings: true
};

// Attributes we keep to preserve semantics and minimal usefulness
const ALLOWED_ATTRS = new Set([
  // identity/semantics
  'id', 'class', 'role',
  // internationalization
  'lang', 'dir',
  // ARIA
  // (handled via regex below)
  // data-* (kept via regex below)

  // anchors & media
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',

  // tables
  'scope', 'headers', 'colspan', 'rowspan',

  // forms (pure semantics—doesn’t change structure)
  'name', 'value', 'type', 'for', 'placeholder', 'checked', 'selected', 'multiple', 'method', 'action',

  // time, figure, etc.
  'datetime'
]);

const ALLOWED_ATTR_REGEXES = [
  /^aria-[\w-]+$/i,   // ARIA attributes
  /^data-[\w-]+$/i    // data-* attributes (often carry app semantics)
];

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

/**
 * Scrub HTML conservatively for LLMs without destroying semantics.
 */
export async function scrubHtml(
  { html, url }: { html: string, url: string },
  opts: SemanticScrubOptions = {},
): Promise<string> {
  const o = { ...DEFAULTS, ...opts };

  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // 1) Optionally remove <head>
  if (o.dropHead) {
    const head = doc.querySelector('head');
    if (head) head.remove();
  }

  // 2) Remove infra/noise elements (but leave SVG unless asked)
  const toDrop = [...ALWAYS_DROP, o.dropSvg ? 'svg' : ''].filter(Boolean).join(',');
  if (toDrop) doc.querySelectorAll(toDrop).forEach((el) => el.remove());

  // 3) Drop clearly hidden/inert nodes (attribute-based only, no layout assumptions)
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

  // 4) Strip event handlers + non-allowed attributes, keep semantics
  if (o.stripAttributes) {
    const all = [...doc.body.querySelectorAll<HTMLElement>('*')];
    for (const el of all) {
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
        // Allow explicit list
        if (ALLOWED_ATTRS.has(lower)) continue;
        // Allow aria-* and data-* (and other regex-allowed)
        if (ALLOWED_ATTR_REGEXES.some((re) => re.test(name))) continue;

        // Otherwise drop verbose/noisy attrs (integrity, crossorigin, referrerpolicy, etc.)
        el.removeAttribute(name);
      }
    }

    // Also sanitize <a href="javascript:..."> (keep tag, drop href)
    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (/^\s*javascript:/i.test(href)) a.removeAttribute('href');
    });
  }

  // 5) Remove comments
  if (o.dropComments) {
    const walker = doc.createTreeWalker(doc, dom.window.NodeFilter.SHOW_COMMENT);
    const toRemove: Comment[] = [];
    let n: Comment | null;
     
    while ((n = walker.nextNode() as Comment | null)) toRemove.push(n);
    toRemove.forEach((c) => c.parentNode?.removeChild(c));
  }

  // 6) Replace <br> inside headings (h1–h6) with a space to keep words together
  // This runs before whitespace normalization so spaces are later collapsed/trimmed appropriately.
  if (o.replaceBrInHeadings) {
    doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      h.querySelectorAll('br').forEach((br) => {
        const space = doc.createTextNode(' ');
        (br as Element).replaceWith(space);
      });
    });
  }

  // 7) Normalize whitespace in text nodes (but not inside pre/code)
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
