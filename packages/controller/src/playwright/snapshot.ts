import { Snapshot } from '../types';
import { Page } from '@playwright/test';
import { sleep } from '../utils/sleep';

export async function snapshot(page: Page): Promise<Snapshot> {
  await sleep(500);
  await page.waitForLoadState('domcontentloaded');

  const [ url, html, screenshot ] = await Promise.all([
    page.url(),
    page.content(),
    page.screenshot(),
  ]);

  return { url, html, screenshot };
}
