import metascraper, { type MetascraperOptions } from 'metascraper';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLang from 'metascraper-lang';
import metascraperLogo from 'metascraper-logo';
import metascraperLogoFavicon from 'metascraper-logo-favicon';
import metascraperTitle from 'metascraper-title';
import metascraperUrl from 'metascraper-url';
import type { PageInfo, Snapshot } from './types';

const scrape = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperLogoFavicon(),
  metascraperLang(),
  metascraperUrl(),
]);

export async function extractPageInfo(options: MetascraperOptions & Partial<Snapshot>): Promise<PageInfo> {
  const meta = await scrape(options);

  return {
    url: meta.url || options.url,
    title: meta.title || undefined,
    description: meta.description || undefined,
    image: meta.image || undefined,
    favicon: meta.logo || undefined,
    lang: meta.lang || undefined,
    screenshot: options.screenshot,
  };
}
