import type { Locator } from '@playwright/test';

export async function scrollToCenter(locator: Locator) {
  const count = await locator.count();
  if (!count) return;

  await locator.evaluate((el) => {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  });
}
