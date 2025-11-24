import type { Snapshot } from './types';
import type { Page, PageScreenshotOptions } from '@playwright/test';
import { hash, sleep } from '@letsrunit/utils';
import { waitForDomIdle } from './wait';
import { File } from 'node:buffer';

export async function snapshot(page: Page): Promise<Snapshot> {
  await sleep(500);
  await waitForDomIdle(page);

  const [url, html, file] = await Promise.all([page.url(), page.content(), screenshot(page)]);

  return { url, html, screenshot: file };
}

export async function screenshot(page: Page, options?: PageScreenshotOptions): Promise<File> {
  const buffer = await page.screenshot(options);
  return new File([buffer], `screenshot-${hash(buffer)}.png`, { type: 'image/png' });
}
