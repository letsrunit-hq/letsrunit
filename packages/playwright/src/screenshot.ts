import { hashKey } from '@letsrunit/utils';
import type { Page, PageScreenshotOptions } from '@playwright/test';
import { File } from 'node:buffer';

export async function screenshot(page: Page, options?: PageScreenshotOptions): Promise<File> {
  const buffer = options?.mask?.length ? await screenshotWithMask(page, options) : await page.screenshot(options);
  const filename = await hashKey(`screenshot-{hash}.png`, buffer);

  return new File([new Uint8Array(buffer)], filename, { type: 'image/png' });
}

async function screenshotWithMask(page: Page, options: PageScreenshotOptions): Promise<Buffer> {
  const { mask: locators, ...otherOptions } = options;

  if (!locators?.length) throw new Error('No locators specified');

  // 1. Inject CSS + overlay
  await page.evaluate(() => {
    const doc = document;

    // Inject CSS once
    if (!doc.getElementById('lri-mask-style')) {
      const style = doc.createElement('style');
      style.id = 'lri-mask-style';
      style.textContent = `
        .lri-mask-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          pointer-events: none;
          z-index: 2147483646;
        }
        .lri-mask-highlight {
          position: relative !important;
          z-index: 2147483647 !important;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95);
          border-radius: 4px;
        }
      `;
      doc.head.appendChild(style);
    }

    if (!doc.getElementById('lri-mask-overlay')) {
      const overlay = doc.createElement('div');
      overlay.id = 'lri-mask-overlay';
      overlay.className = 'lri-mask-overlay';
      doc.body.appendChild(overlay);
    }
  });

  // 2. Resolve locators to element handles and add highlight class
  const handleGroups = await Promise.all(locators.map((loc) => loc.elementHandles()));
  const handles = handleGroups.flat();

  await Promise.all(
    handles.map((h) =>
      h.evaluate((el) => {
        (el as HTMLElement).classList.add('lri-mask-highlight');
      }),
    ),
  );

  try {
    // 3. Take screenshot with overlay in place
    return await page.screenshot(otherOptions);
  } finally {
    // 4. Cleanup: remove classes and overlay (keep CSS optional)
    await Promise.all(
      handles.map((h) =>
        h.evaluate((el) => {
          (el as HTMLElement).classList.remove('lri-mask-highlight');
        }),
      ),
    );

    await page.evaluate(() => {
      const overlay = document.getElementById('lri-mask-overlay');
      if (overlay) overlay.remove();

      // Optional: remove style as well if you want zero residue
      const style = document.getElementById('lri-mask-style');
      if (style) style.remove();
    });
  }
}
