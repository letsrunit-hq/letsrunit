import { When } from '../dsl';
import { Locator } from '@playwright/test';
import type { KeyCombo } from '@letsrunit/gherkin';

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

When("I {click|double-click|right-click|hover} {locator}", async ({ page }, action: MouseAction, selector: string) => {
  const el = page.locator(selector);
  await press(el, action);
});

When(
  "I {click|double-click|right-click|hover} {locator} while holding {keys}",
  async ({ page }, action: MouseAction, selector: string, combo: KeyCombo) => {
    const el = page.locator(selector);
    const keys = [...combo.modifiers, combo.key];

    for (const m of keys) await page.keyboard.down(m);
    await press(el, action);
    for (const m of keys.reverse()) await page.keyboard.up(m);
  },
);

When("I scroll {locator} into view", async ({ page }, selector: string) => {
  const el = page.locator(selector);
  await el.scrollIntoViewIfNeeded({ timeout: TIMEOUT });
});
