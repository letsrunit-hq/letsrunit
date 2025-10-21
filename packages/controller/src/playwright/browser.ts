import type { Browser, BrowserContextOptions, Page } from '@playwright/test';

// Launch a minimal, headless Chromium instance.
export async function browse(browser: Browser, options: BrowserContextOptions = {}): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    ...options,
  });

  // Safety net against bundler-injected helpers inside page.evaluate
  await context.addInitScript(() => {
    // define __name as a no-op if present
    (window as any).__name = (window as any).__name || ((fn: any) => fn);
  });

  return await context.newPage();
}
