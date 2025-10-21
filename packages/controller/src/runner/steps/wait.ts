import { When } from '../dsl';

When("I wait for {locator} to be {visible|hidden}", async ({ page }, selector: string, visible: boolean) => {
  const el = page.locator(selector);
  await el.waitFor({ state: visible ? 'visible' : 'hidden' });
});

When('I wait for {locator} to {contain|not contain} {locator}', async ({ page }, selector: string, contain: boolean, child: string) => {
  const el = page.locator(selector);
});
