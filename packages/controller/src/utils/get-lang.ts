import metascraper from 'metascraper';
import metascraperLang from 'metascraper-lang';

const scrapeLang = metascraper([metascraperLang()]);

export async function getLang(page: { html: string; url: string }): Promise<string | null> {
  const meta = await scrapeLang(page);
  return meta.lang ?? null;
}
