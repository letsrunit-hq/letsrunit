import { sleep } from '@letsrunit/utils';
import type { Page } from '@playwright/test';
import { screenshot } from './screenshot';
import type { Snapshot } from './types';
import { waitForDomIdle } from './wait';

export async function snapshot(page: Page): Promise<Snapshot> {
  await sleep(500);
  await waitForDomIdle(page);

  const [url, html, file] = await Promise.all([page.url(), getContentWithMarkedHidden(page), screenshot(page)]);

  return { url, html, screenshot: file };
}

async function getContentWithMarkedHidden(page: Page): Promise<string> {
  try {
    await page.evaluate(() => {
      const changed: Element[] = [];

      // expose undo
      (window as any).__undoAriaHidden = () => {
        for (const el of changed) el.removeAttribute('aria-hidden');
        changed.length = 0;
        delete (window as any).__undoAriaHidden;
      };

      const isHidden = (el: Element): boolean => {
        if (el.hasAttribute('hidden')) return true;
        if (el.hasAttribute('inert')) return true;
        if (el.getAttribute('aria-hidden') === 'true') return true;

        const cs = getComputedStyle(el as HTMLElement);
        return cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0';
      };

      const walk = (el: Element) => {
        if (isHidden(el)) {
          if (!el.hasAttribute('aria-hidden')) {
            el.setAttribute('aria-hidden', 'true');
            changed.push(el);
          }
          return;
        }
        for (const c of el.children) walk(c);
      };

      for (const c of document.body.children) walk(c);
    });

    return await page.content();
  } finally {
    await page.evaluate(() => (window as any).__undoAriaHidden?.()).catch(() => {});
  }
}
