import { When } from '../dsl';

When("I wait for {locator} to be {visible|hidden}", async ({ page }, selector: string, visible: boolean) => {
  const el = page.locator(selector);
  await el.waitFor({ state: visible ? 'visible' : 'hidden' });
});

When('I wait for {locator} to {contain|not contain} {locator}', async ({ page }, selector: string, contain: boolean, value: number | string) => {
  const el = page.locator(selector);
  const text = String(value);
  const filtered = el.filter({ hasText: text });
  if (contain) {
    await filtered.first().waitFor({ state: 'attached' });
  } else {
    await filtered.waitFor({ state: 'detached' });
  }
});
