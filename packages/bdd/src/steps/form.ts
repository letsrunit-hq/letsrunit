import { locator } from '@letsrunit/playwright';
import { sleep } from '@letsrunit/utils';
import { setFieldValue } from 'packages/playwright/src/field/field';
import { When } from './wrappers';

const TIMEOUT = 500;
const DELAY = 500;

export const set = When('I set {locator} to {value}', async function (selector: string, value: string | number | Date) {
  const el = await locator(this.page, selector);
  await setFieldValue(el, value, { timeout: TIMEOUT });
  await sleep(DELAY);
});

export const clear = When('I clear {locator}', async function (selector) {
  const el = await locator(this.page, selector);
  await el.clear({ timeout: TIMEOUT });
});

export const check = When(
  'I {check|uncheck} {locator}',
  async function (check: boolean, selector: string) {
    const el = await locator(this.page, selector);
    await setFieldValue(el, check, { timeout: TIMEOUT });
    await sleep(DELAY);
  },
  'For checkbox input or switch component',
);

export const focus = When('I {focus|blur} {locator}', async function (focus: boolean, selector: string) {
  const el = await locator(this.page, selector);

  if (focus) {
    await el.focus({ timeout: TIMEOUT });
  } else {
    await el.blur({ timeout: TIMEOUT });
  }
});
