import { When } from '../dsl';

const TIMEOUT = 2500;

When("I fill {locator} with {value}", async ({ page }, selector: string, value: string | number) => {
  await page.locator(selector).fill(String(value), { timeout: TIMEOUT });
});

When("I clear {locator}", async ({ page }, selector) => {
  await page.locator(selector).clear({ timeout: TIMEOUT });
});

When("I type {string} into {locator}", async ({ page }, value: string, selector: string) => {
  await page.locator(selector).pressSequentially(value, { delay: 200, timeout: TIMEOUT });
});

When("I select {string} in {locator}", async ({ page }, value: string, selector: string) => {
  const el = page.locator(selector);
  const result = await el.selectOption({ label: value, value }, { timeout: 5000 });

  if (result.length === 0) {
    throw new Error(`Option "${value}" not found in select ${selector}`);
  }
});

When("I {check|uncheck} {locator}", async ({ page }, check: boolean, selector: string) => {
  const el = page.locator(selector);

  if (check) {
    await el.check({ timeout: TIMEOUT });
  } else {
    await el.uncheck({ timeout: TIMEOUT });
  }
});

When("I {focus|blur} {locator}", async ({ page }, focus: boolean, selector: string) => {
  const el = page.locator(selector);

  if (focus) {
    await el.focus({ timeout: TIMEOUT });
  } else {
    await el.blur({ timeout: TIMEOUT });
  }
});
