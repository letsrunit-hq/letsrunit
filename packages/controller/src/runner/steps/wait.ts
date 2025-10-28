import { Then } from '../dsl';
import { expectOrNot } from '../../utils/test-helpers';

const WAIT_TIMEOUT = 5000;

Then("{locator} should be {visible|hidden}", async ({ page }, selector: string, visible: boolean) => {
  const el = page.locator(selector);
  return expectOrNot(el, visible).toBeVisible({ timeout: WAIT_TIMEOUT });
});

Then('{locator} should {contain|not contain} {locator}', async ({ page }, selector: string, contain: boolean, child: string) => {
  const childElement = page.locator(selector).locator(child);
  return expectOrNot(childElement, contain).toBeAttached({ timeout: WAIT_TIMEOUT });
});
