import { Snapshot } from '../types';
import { Page } from '@playwright/test';

export async function snapshot(page: Page): Promise<Snapshot> {
  await page.waitForLoadState('domcontentloaded');

  const [ url, html, screenshot ] = await Promise.all([
    page.url(),
    page.content(),
    page.screenshot(),
  ]);

  return { url, html, screenshot };
}
