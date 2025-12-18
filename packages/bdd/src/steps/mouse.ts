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
  async function (action: MouseAction, selector: string) {
    const prevUrl = this.page.url();

    const el = await locator(this.page, selector);
    await press(el, action);

    await waitAfterInteraction(this.page, el, { prevUrl });
  },
);

export const clickHold = When(
  'I {click|double-click|right-click|hover} {locator} while holding {keys}',
  async function (action: MouseAction, selector: string, combo: KeyCombo) {
    const prevUrl = this.page.url();

    const el = await locator(this.page, selector);
    const keys = [...combo.modifiers, combo.key];

    for (const m of keys) await this.page.keyboard.down(m);
    await press(el, action);
    for (const m of keys.reverse()) await this.page.keyboard.up(m);

    await waitAfterInteraction(this.page, el, { prevUrl });
  },
);

export const scroll = When('I scroll {locator} into view', async function (selector: string) {
  const el = await locator(this.page, selector);
  await el.scrollIntoViewIfNeeded({ timeout: TIMEOUT });
});
