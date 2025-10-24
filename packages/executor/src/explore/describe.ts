import { scrubHtml } from '../utils/scrub-html';
import { htmlToStructuredMarkdown } from '../utils/structured-markdown';
import { stringify as toYaml } from 'yaml';
import type { PageInfo } from '../types';

import metascraper, { MetascraperOptions } from 'metascraper';
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

async function extractPageInfo(options: MetascraperOptions): Promise<PageInfo> {
  const meta = await scrape(options);

  return {
    url: meta.url || options.url,
    title: meta.title || undefined,
    description: meta.description || undefined,
    image: meta.image || undefined,
    favicon: meta.logo || undefined,
    lang: meta.lang || undefined,
  };
}

export async function describePage(page: { url: string, html: string }): Promise<string> {
  const info = await extractPageInfo(page);

  const content = await scrubHtml(page);
  const markdown = await htmlToStructuredMarkdown(content);

  return [
    '---',
    toYaml(info, { lineWidth: 0 }).trim(),
    '---',
    '',
    markdown
  ].join('\n');
}
