import type { PageInfo } from '../types';
import type { Snapshot } from '@letsrunit/playwright';
import metascraper, { type MetascraperOptions } from 'metascraper';
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

