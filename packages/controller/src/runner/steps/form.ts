import { When } from '../dsl';
import { locator } from '../../playwright/locator';

const TIMEOUT = 500;

When("I fill {locator} with {value}", async ({ page }, selector: string, value: string | number) => {
  const el = await locator(page, selector);
  await el.fill(String(value), { timeout: TIMEOUT });
});

When("I clear {locator}", async ({ page }, selector) => {
  const el = await locator(page, selector);
  await el.clear({ timeout: TIMEOUT });
});

When(
  "I type {string} into {locator}",
  async ({ page }, value: string, selector: string) => {
    const el = await locator(page, selector);
    await el.pressSequentially(value, { delay: 200, timeout: TIMEOUT });
  },
  "Use with caution; prefer `fill` above `type`",
);

When("I select {string} in {locator}", async ({ page }, value: string, selector: string) => {
  const el = await locator(page, selector);
  const result = await el.selectOption({ label: value, value }, { timeout: 5000 });

  if (result.length === 0) {
    throw new Error(`Option "${value}" not found in select ${selector}`);
  }
});

When("I {check|uncheck} {locator}", async ({ page }, check: boolean, selector: string) => {
  const el = await locator(page, selector);

  if (check) {
    await el.check({ timeout: TIMEOUT });
  } else {
    await el.uncheck({ timeout: TIMEOUT });
  }
});

When("I {focus|blur} {locator}", async ({ page }, focus: boolean, selector: string) => {
  const el = await locator(page, selector);

  if (focus) {
    await el.focus({ timeout: TIMEOUT });
  } else {
    await el.blur({ timeout: TIMEOUT });
  }
});
