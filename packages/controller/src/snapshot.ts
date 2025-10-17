import { Page } from '@playwright/test';
import { PageLike } from '@letsrunit/core/types';

interface SnapshotOptions {
  title: boolean;
}

export async function snapshot(page: Page, opts: SnapshotOptions): Promise<PageLike> {
  const content = await page.content();
  const url = page.url();
  const title = opts.title ? await page.title() : undefined;

  return {
    content: () => content,
    url: () => url,
    title: title ? () => title : undefined,
  };
}
