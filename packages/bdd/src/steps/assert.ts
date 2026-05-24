import { fuzzyLocator } from '@letsrunit/playwright';
import { Then } from '../registry';
import { expectOrNot } from '../utils/test-helpers';

const WAIT_TIMEOUT = 5000;

export const see = Then(
  'the page {contains|does not contain} {locator}',
  async function (visible: boolean, selector: string) {
    const el = await fuzzyLocator(this.page, selector);
    await expectOrNot(el, visible).toBeVisible({ timeout: WAIT_TIMEOUT });
  },
);

export const visible = Then(
  '{locator} is {visible|hidden}',
  async function (selector: string, visible: boolean) {
    const el = await fuzzyLocator(this.page, selector);
    await expectOrNot(el, visible).toBeVisible({ timeout: WAIT_TIMEOUT });
  },
);

export const contain = Then(
  '{locator} {contains|does not contain} {locator}',
  async function (selector: string, contain: boolean, child: string) {
    const el = await fuzzyLocator(this.page, selector);
    const childElement = el.locator(child);
    await expectOrNot(childElement, contain).toBeAttached({ timeout: WAIT_TIMEOUT });
  },
);

export const focused = Then(
  '{locator} has focus',
  async function (selector: string) {
    const el = await fuzzyLocator(this.page, selector);
    await expectOrNot(el, true).toBeFocused({ timeout: WAIT_TIMEOUT });
  },
);

export const notFocused = Then(
  '{locator} does not have focus',
  async function (selector: string) {
    const el = await fuzzyLocator(this.page, selector);
    await expectOrNot(el, false).toBeFocused({ timeout: WAIT_TIMEOUT });
  },
);
