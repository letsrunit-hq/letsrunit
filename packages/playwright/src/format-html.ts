import type { Page } from '@playwright/test';
import rehypeFormat from 'rehype-format';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';

export async function formatHtml(page: string | Page) {
  const html = typeof page === 'string' ? page : await page.content();

  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeFormat, { indent: 2 }) // collapses existing whitespace and formats nodes
    .use(rehypeStringify)
    .process(html);
  
  return String(file);
}
