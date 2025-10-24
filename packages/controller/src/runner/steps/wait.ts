import { When } from '../dsl';

const WAIT_TIMEOUT = 5000;

When("I wait for {locator} to be {visible|hidden}", async ({ page }, selector: string, visible: boolean) => {
  const el = page.locator(selector);
  await el.waitFor({ state: visible ? 'visible' : 'hidden', timeout: WAIT_TIMEOUT });
});

When('I wait for {locator} to {contain|not contain} {locator}', async ({ page }, selector: string, contain: boolean, child: string) => {
  const childElement = page.locator(selector).locator(child);

  await childElement.waitFor({
    state: contain ? 'attached' : 'detached',
    timeout: WAIT_TIMEOUT,
  });
});
