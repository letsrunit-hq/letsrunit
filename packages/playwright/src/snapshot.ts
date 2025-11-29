import { sleep } from '@letsrunit/utils';
import type { Page } from '@playwright/test';
import { screenshot } from './screenshot';
import type { Snapshot } from './types';
import { waitForDomIdle } from './wait';

export async function snapshot(page: Page): Promise<Snapshot> {
  await sleep(500);
  await waitForDomIdle(page);

  const [url, html, file] = await Promise.all([page.url(), page.content(), screenshot(page)]);

  return { url, html, screenshot: file };
}
