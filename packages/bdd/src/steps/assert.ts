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

export const contain = Then(
  '{locator} {contains|does not contain} {locator}',
  async function (selector: string, contain: boolean, child: string) {
    const el = await fuzzyLocator(this.page, selector);
    const childElement = el.locator(child);
    await expectOrNot(childElement, contain).toBeAttached({ timeout: WAIT_TIMEOUT });
  },
);
