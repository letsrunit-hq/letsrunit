import { JSDOM } from 'jsdom';
import type { PageInfo, Snapshot } from './types';

export function extractPageMetadata(snapshot: Pick<Snapshot, 'url' | 'html'>): Omit<PageInfo, 'screenshot'> {
  const dom = new JSDOM(snapshot.html, { url: snapshot.url });
  const doc = dom.window.document;

  return {
    url: resolveCanonicalUrl(doc, snapshot.url),
    name: firstNonEmpty(
      metaContent(doc, 'property', 'og:title'),
      metaContent(doc, 'name', 'twitter:title'),
      doc.title,
    ),
    description: firstNonEmpty(
      metaContent(doc, 'name', 'description'),
      metaContent(doc, 'property', 'og:description'),
      metaContent(doc, 'name', 'twitter:description'),
    ),
    image: resolveUrl(
      snapshot.url,
      firstNonEmpty(
        metaContent(doc, 'property', 'og:image'),
        metaContent(doc, 'name', 'twitter:image'),
      ),
    ),
    logo: resolveUrl(snapshot.url, firstLinkHref(doc, ['link[rel~="apple-touch-icon"]', 'link[rel~="icon"]'])),
    author: firstNonEmpty(metaContent(doc, 'name', 'author')),
    publisher: firstNonEmpty(
      metaContent(doc, 'property', 'article:publisher'),
      metaContent(doc, 'name', 'publisher'),
      metaContent(doc, 'property', 'og:site_name'),
    ),
    lang: firstNonEmpty(doc.documentElement.lang),
    favicon: resolveUrl(snapshot.url, firstLinkHref(doc, ['link[rel~="icon"]', 'link[rel="shortcut icon"]'])),
  };
}

function metaContent(doc: Document, attr: 'name' | 'property', value: string): string | undefined {
  return firstNonEmpty(doc.querySelector(`meta[${attr}="${value}"]`)?.getAttribute('content') ?? undefined);
}

function firstLinkHref(doc: Document, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const href = firstNonEmpty(doc.querySelector(selector)?.getAttribute('href') ?? undefined);
    if (href) return href;
  }

  return undefined;
}

function resolveCanonicalUrl(doc: Document, fallbackUrl: string): string {
  return resolveUrl(fallbackUrl, firstLinkHref(doc, ['link[rel="canonical"]'])) ?? fallbackUrl;
}

function resolveUrl(baseUrl: string, candidate?: string): string | undefined {
  const value = firstNonEmpty(candidate);
  if (!value) return undefined;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value.trim() !== '')?.trim();
}
