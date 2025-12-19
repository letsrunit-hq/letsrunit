import { sleep } from '@letsrunit/utils';
import type { Locator, Page } from '@playwright/test';

export async function waitForIdle(page: Page, timeout = 2500) {
  await page.waitForLoadState('domcontentloaded');
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {}
}

export async function waitForMeta(page: Page, timeout = 2500) {
  await waitForIdle(page);

  page.getByRole('navigation');

  await page
    .waitForFunction(
      () => {
        const head = document.head;
        if (!head) return false;

        return Boolean(
          document.title.trim() ||
            head.querySelector('meta[property^="og:"]') ||
            head.querySelector('meta[name^="twitter:"]') ||
            head.querySelector('script[type="application/ld+json"]'),
        );
      },
      { timeout },
    )
    .catch(() => {});
}

/** Wait until the DOM hasn't changed for `quiet` (default 500ms). */
export async function waitForDomIdle(
  page: Page,
  { quiet = 500, timeout = 10_000 }: { quiet?: number; timeout?: number } = {},
) {
  await page.waitForFunction(
    (q) =>
      new Promise<boolean>((resolve) => {
        let last = performance.now();

        const obs = new MutationObserver(() => (last = performance.now()));
        obs.observe(document, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });

        const tick = () => {
          if (performance.now() - last >= q) {
            obs.disconnect();
            resolve(true);
            return;
          }
          requestAnimationFrame(tick);
        };
        tick();
      }),
    quiet,
    { timeout },
  );
}

export async function waitForUrlChange(page: Page, prevUrl: string, timeout: number) {
  try {
    await page.waitForFunction((u) => location.href !== u, prevUrl, { timeout });
    return true;
  } catch {
    return false;
  }
}

export async function waitUntilEnabled(page: Page, target: Locator, timeout: number) {
  // Poll for not disabled && aria-disabled != "true"
  await target.waitFor({ state: 'attached', timeout }).catch(() => {});
  const handle = await target.elementHandle().catch(() => null);
  if (!handle) return;

  await page
    .waitForFunction(
      (el) => {
        if (!el || !(el as Element).isConnected) return true; // detached → treat as settled
        const aria = (el as HTMLElement).getAttribute('aria-disabled');
        const disabled =
          (el as HTMLButtonElement).disabled ||
          aria === 'true' ||
          (el as HTMLElement).getAttribute('disabled') !== null;
        return !disabled;
      },
      handle,
      { timeout },
    )
    .catch(() => {});
}

export async function waitAfterInteraction(
  page: Page,
  target: Locator,
  opts: { prevUrl?: string; navTimeout?: number; settleTimeout?: number; quietMs?: number } = {},
) {
  const navTimeout = opts.navTimeout ?? 8_000;
  const settleTimeout = opts.settleTimeout ?? 6_000;
  const quietMs = opts.quietMs ?? 500;

  const prevUrl = opts.prevUrl ?? page.url();
  const kind = await elementKind(target).catch(() => 'other');

  if (kind === 'link') {
    // SPA or full nav: wait for URL change; if it changed, wait for DOM to settle.
    const urlChanged = await waitForUrlChange(page, prevUrl, navTimeout);
    if (urlChanged) {
      // Avoid 'networkidle' for SPAs with websockets/long-polling.
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await waitForDomIdle(page, { quiet: quietMs, timeout: navTimeout }).catch(() => {});
      return;
    }
    // Link didn’t navigate (preventDefault, same hash, etc.) → fall back.
    await waitForDomIdle(page, { quiet: quietMs }).catch(() => {});
    return;
  }

  if (kind === 'button' && (await target.isDisabled())) {
    // Buttons often disable during in-flight work, or disappear on success.
    await Promise.race([
      waitUntilEnabled(page, target, settleTimeout).catch(() => {}),
      target.waitFor({ state: 'hidden', timeout: settleTimeout }).catch(() => {}),
      target.waitFor({ state: 'detached', timeout: settleTimeout }).catch(() => {}),
      waitForUrlChange(page, prevUrl, settleTimeout).catch(() => {}),
    ]);
    await sleep(1000); // Grace periode for redirect
    await waitForDomIdle(page, { quiet: quietMs }).catch(() => {});
    return;
  }
}

/* ---------- helpers ---------- */

async function elementKind(target: Locator): Promise<'link' | 'button' | 'other'> {
  const role = await target.getAttribute('role').catch(() => null);
  if (role === 'link') return 'link';
  if (role === 'button') return 'button';

  const tag = await target.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');
  if (tag === 'a') return 'link';

  if (tag === 'button') return 'button';
  if (tag === 'input') {
    const type = await target.getAttribute('type').catch(() => null);
    if (type === 'button' || type === 'submit' || type === 'reset') return 'button';
  }

  return 'other';
}
