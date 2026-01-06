import { locator } from '@letsrunit/playwright';
import { sleep } from '@letsrunit/utils';
import { When } from './wrappers';

const TIMEOUT = 500;
const DELAY = 500;

export const fill = When('I fill {locator} with {value}', async function (selector: string, value: string | number | Date) {
  const el = await locator(this.page, selector);
  await el.fill(String(value), { timeout: TIMEOUT });
  await sleep(DELAY);
});

export const clear = When('I clear {locator}', async function (selector) {
  const el = await locator(this.page, selector);
  await el.clear({ timeout: TIMEOUT });
});

export const type = When(
  'I type {string} into {locator}',
  async function (value: string, selector: string) {
    const el = await locator(this.page, selector);
    await el.pressSequentially(value, { delay: 200, timeout: TIMEOUT });
    await sleep(DELAY);
  },
  'hidden',
);

export const select = When('I select {string} in {locator}', async function (value: string, selector: string) {
  const el = await locator(this.page, selector);
  const result = await el.selectOption({ label: value, value }, { timeout: 5000 });

  if (result.length === 0) {
    throw new Error(`Option "${value}" not found in select ${selector}`);
  }

  await sleep(DELAY);
});

export const check = When(
  'I {check|uncheck} {locator}',
  async function (check: boolean, selector: string) {
    const el = await locator(this.page, selector);

    if (check) {
      await el.check({ timeout: TIMEOUT });
    } else {
      await el.uncheck({ timeout: TIMEOUT });
    }

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
