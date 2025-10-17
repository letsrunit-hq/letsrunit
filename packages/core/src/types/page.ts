import { MaybeAsync } from './util';

// Must match a Playwright Page
export interface PageLike {
  content: MaybeAsync<() => string>;
  url: () => string;
  title?: MaybeAsync<() => string>;
}

export interface PageInfo {
  /** Page title (from <title> or meta tags) */
  title?: string;

  /** Short page description (meta description or OG/Twitter) */
  description?: string;

  /** Main image for previews (OpenGraph/Twitter) */
  image?: string;

  /** Site or brand logo if available */
  logo?: string;

  /** Author name if specified */
  author?: string;

  /** Publisher or organization name */
  publisher?: string;

  /** Page language, e.g. "en", "nl-NL" */
  lang?: string;

  /** Favicon URL */
  favicon?: string;

  /** Canonical or resolved page URL */
  url: string;
}
