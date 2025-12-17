import type { Snapshot } from '@letsrunit/playwright';
import { Page } from '@playwright/test';
import ISO6391 from 'iso-639-1';
import metascraper from 'metascraper';
import metascraperLang from 'metascraper-lang';

const scrapeLang = metascraper([metascraperLang()]);

export async function getLang(
  page: Pick<Page, 'content' | 'url'> | Snapshot,
): Promise<{ code: string; name: string} | null> {
  const html = 'html' in page ? page.html : await page.content();
  const url = typeof page.url === 'function' ? page.url() : page.url;

  const { lang = null } = await scrapeLang({ html, url });
  if (!lang) return null;

  const code = lang.substring(0, 2);
  const name = ISO6391.getName(code) || code;

  return { code, name };
}
