import type { Page } from '@playwright/test';
import { extractPageMetadata } from './page-metadata';
import { screenshot as takeScreenshot } from './screenshot';
import type { PageInfo, Snapshot } from './types';
import { isPage } from './utils/type-check';

type PageLike = Page | Partial<Snapshot> & { url: string; html: string };

export async function extractPageInfo(page: PageLike): Promise<PageInfo> {
  const snapshot = isPage(page)
    ? {
        url: page.url(),
        html: await page.content(),
        screenshot: await takeScreenshot(page),
      }
    : page;

  return {
    ...extractPageMetadata(snapshot),
    screenshot: snapshot.screenshot,
  };
}
