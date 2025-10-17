import { scrubHtml } from './utils/scrub-html';
import { htmlToStructuredMarkdown } from './utils/structured-markdown';
import { extractPageInfo } from './page-info';
import { PageLike } from '@letsrunit/core/types';
import { stringify as toYaml } from 'yaml';

export async function describePage(page: PageLike): Promise<string> {
  const info = await extractPageInfo(page);

  const html = await scrubHtml(page);
  const markdown = await htmlToStructuredMarkdown(html);

  return [
    '---',
    toYaml(info, { lineWidth: 0 }).trim(),
    '---',
    '',
    markdown
  ].join('\n');
}
