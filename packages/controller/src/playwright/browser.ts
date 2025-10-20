import type { Browser, Page } from '@playwright/test';
import { chromium } from 'playwright';

// Launch a minimal, headless Chromium instance. The caller is responsible for closing it via page.context().browser()?.close()
export async function browse(): Promise<Page> {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
  });

  // Safety net against bundler-injected helpers inside page.evaluate
  await context.addInitScript(() => {
    // define __name as a no-op if present
    (window as any).__name = (window as any).__name || ((fn: any) => fn);
  });

  return await context.newPage();
}

export async function close(browser: Browser): Promise<void> {
  await browser.close();
}
