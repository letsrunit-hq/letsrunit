import type { KeyCombo } from '@letsrunit/gherkin';
import { locator, waitAfterInteraction } from '@letsrunit/playwright';
import type { Locator } from '@playwright/test';
import { When } from './wrappers';

const TIMEOUT = 2500;

type MouseAction = 'click' | 'double-click' | 'right-click' | 'hover';

async function press(el: Locator, action: MouseAction) {
  if (action === 'hover') {
    await el.hover({ timeout: TIMEOUT });
  } else {
    await el.click({
      button: action === 'right-click' ? 'right' : 'left',
      clickCount: action === 'double-click' ? 2 : 1,
      timeout: TIMEOUT,
    });
  }
}

export const click = When(
  'I {click|double-click|right-click|hover} {locator}',
  async ({ page }, action: MouseAction, selector: string) => {
    const prevUrl = page.url();

    const el = await locator(page, selector);
    await press(el, action);

    await waitAfterInteraction(page, el, { prevUrl });
  },
);

export const clickHold = When(
  'I {click|double-click|right-click|hover} {locator} while holding {keys}',
  async ({ page }, action: MouseAction, selector: string, combo: KeyCombo) => {
    const prevUrl = page.url();

    const el = await locator(page, selector);
    const keys = [...combo.modifiers, combo.key];

    for (const m of keys) await page.keyboard.down(m);
    await press(el, action);
    for (const m of keys.reverse()) await page.keyboard.up(m);

    await waitAfterInteraction(page, el, { prevUrl });
  },
);

export const scroll = When('I scroll {locator} into view', async ({ page }, selector: string) => {
  const el = await locator(page, selector);
  await el.scrollIntoViewIfNeeded({ timeout: TIMEOUT });
});
