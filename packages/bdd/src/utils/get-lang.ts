import type { Snapshot } from '@letsrunit/playwright';
import { Page } from '@playwright/test';
import metascraper from 'metascraper';
import metascraperLang from 'metascraper-lang';

const scrapeLang = metascraper([metascraperLang()]);

export async function getLang(page: Pick<Page, 'content' | 'url'> | Snapshot): Promise<string | null> {
  const html = 'html' in page ? page.html : await page.content();
  const url = typeof page.url === 'function' ? page.url() : page.url;

  const meta = await scrapeLang({ html, url });
  return meta.lang ?? null;
}
