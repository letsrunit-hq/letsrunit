import { Given, When, Then } from '../dsl';
import { waitForIdle } from '../../playwright/wait';

Given('I open url {string}', async ({ page }, url: string) => {
  await page.goto(url);
  await waitForIdle(page);
});
