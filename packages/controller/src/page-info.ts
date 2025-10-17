import metascraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLang from 'metascraper-lang';
import metascraperLogo from 'metascraper-logo';
import metascraperLogoFavicon from 'metascraper-logo-favicon';
import metascraperUrl from 'metascraper-url';
import { PageLike, PageInfo } from '@letsrunit/core/types';

const scrape = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperLogoFavicon(),
  metascraperLang(),
  metascraperUrl(),
]);

const scrapeLang = metascraper([metascraperLang()]);

export async function extractPageInfo(page: PageLike): Promise<PageInfo> {
  const html = await page.content();
  const url = page.url();

  const meta = await scrape({ html, url });

  return {
    url: meta.url || url,
    title: meta.title || (page.title ? await page.title() : undefined),
    description: meta.description || undefined,
    image: meta.image || undefined,
    favicon: meta.logo || undefined,
    lang: meta.lang || undefined,
  };
}

export async function extractLang(page: PageLike): Promise<string | null> {
  const html = await page.content();
  const url = page.url();

  const meta = await scrapeLang({ html, url });

  return meta.lang ?? null;
}
