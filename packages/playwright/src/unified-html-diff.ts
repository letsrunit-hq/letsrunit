import type { Page } from '@playwright/test';
import * as Diff from 'diff';
import { formatHtml } from './format-html';
import { scrubHtml } from './scrub-html';
import { isPage } from './utils/type-check';

async function format(rawHtml: string, url: string) {
  const html = await scrubHtml({ html: rawHtml, url });
  return await formatHtml(html);
}

export async function unifiedHtmlDiff(
  old: { html: string; url: string } | Page,
  current: { html: string; url: string } | Page,
): Promise<string> {
  if (isPage(old)) old = { html: await old.content(), url: old.url() };
  if (isPage(current)) current = { html: await current.content(), url: current.url() };

  const [a, b] = await Promise.all([format(old.html, old.url), format(current.html, current.url)]);

  return Diff.createTwoFilesPatch('before.html', 'after.html', a, b);
}
