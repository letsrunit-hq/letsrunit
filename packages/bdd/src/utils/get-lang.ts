import { Page } from '@playwright/test';
import metascraper from 'metascraper';
import metascraperLang from 'metascraper-lang';

const scrapeLang = metascraper([metascraperLang()]);

export async function getLang(page: Page): Promise<string | null> {
  const html = await page.content();
  const url = page.url();

  const meta = await scrapeLang({ html, url });
  return meta.lang ?? null;
}
