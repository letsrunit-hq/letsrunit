import { Then } from '../dsl';
import { expectOrNot } from '../../utils/test-helpers';
import { locator } from '../../playwright/locator';

const WAIT_TIMEOUT = 5000;

Then(
  "I see that {locator} is {visible|hidden}",
  async ({ page }, selector: string, visible: boolean) => {
    const el = await locator(page, selector);
    return expectOrNot(el, visible).toBeVisible({ timeout: WAIT_TIMEOUT });
  },
);

Then(
  "I see that {locator} {contains|not contains} {locator}",
  async ({ page }, selector: string, contain: boolean, child: string) => {
    const el = await locator(page, selector);
    const childElement = el.locator(child);
    return expectOrNot(childElement, contain).toBeAttached({ timeout: WAIT_TIMEOUT });
  },
);
