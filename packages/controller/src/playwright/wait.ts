import type { Page } from '@playwright/test';

export async function waitForIdle(page: Page, timeoutMs = 1500) {
  await page.waitForLoadState('domcontentloaded');
  try { await page.waitForLoadState('networkidle', { timeout: timeoutMs }); } catch {}
}

export async function waitForMeta(page: Page, timeoutMs = 1500) {
  await waitForIdle(page);

  page.getByRole('navigation');

  await page.waitForFunction(() => {
    const head = document.head;
    if (!head) return false;

    return Boolean(
      document.title.trim() ||
      head.querySelector('meta[property^="og:"]') ||
      head.querySelector('meta[name^="twitter:"]') ||
      head.querySelector('script[type="application/ld+json"]')
    );
  }, { timeout: timeoutMs }).catch(() => {});
}
