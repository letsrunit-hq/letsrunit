import { expectOrNot } from '../utils/test-helpers';
import { locator } from '@letsrunit/playwright';
import { Then } from './wrappers';

const WAIT_TIMEOUT = 5000;

export const see = Then(
  "I {see|don't see} {locator}",
  async ({ page }, visible: boolean, selector: string) => {
    const el = await locator(page, selector);
    await expectOrNot(el, visible).toBeVisible({ timeout: WAIT_TIMEOUT });
  },
);

export const contain = Then(
  "I see that {locator} {contains|not contains} {locator}",
  async ({ page }, selector: string, contain: boolean, child: string) => {
    const el = await locator(page, selector);
    const childElement = el.locator(child);
    await expectOrNot(childElement, contain).toBeAttached({ timeout: WAIT_TIMEOUT });
  },
);
