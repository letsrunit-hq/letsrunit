import { locator } from '@letsrunit/playwright';
import { expectOrNot } from '../utils/test-helpers';
import { Then } from './wrappers';

const WAIT_TIMEOUT = 5000;

export const see = Then(
  'The page {contains|not contains} {locator}',
  async function (visible: boolean, selector: string) {
    const el = await locator(this.page, selector);
    await expectOrNot(el, visible).toBeVisible({ timeout: WAIT_TIMEOUT });
  },
);

export const contain = Then(
  '{locator} {contains|not contains} {locator}',
  async function (selector: string, contain: boolean, child: string) {
    const el = await locator(this.page, selector);
    const childElement = el.locator(child);
    await expectOrNot(childElement, contain).toBeAttached({ timeout: WAIT_TIMEOUT });
  },
);
