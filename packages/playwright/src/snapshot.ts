import type { Snapshot } from './types';
import type { Page } from '@playwright/test';
import { sleep } from '@letsrunit/utils';
import { waitForDomIdle } from './wait';

export async function snapshot(page: Page): Promise<Snapshot> {
  await sleep(500);
  await waitForDomIdle(page);

  const [ url, html, screenshot ] = await Promise.all([
    page.url(),
    page.content(),
    page.screenshot(),
  ]);

  return { url, html, screenshot };
}
