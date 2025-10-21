import { Given } from '../dsl';
import { waitForIdle } from '../../playwright/wait';
import { suppressInterferences } from '../../playwright/suppress-interferences';

Given("I'm on page {string}", async ({ page }, url: string) => {
  await page.goto(url);
  await waitForIdle(page);
});

Given("All popups are closed", async ({ page }, url: string) => {
  await suppressInterferences(page);
});
