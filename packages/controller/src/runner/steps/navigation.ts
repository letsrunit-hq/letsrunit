import { Given } from '../dsl';
import { suppressInterferences } from '../../playwright/suppress-interferences';

Given("I'm on the homepage", async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
});

Given("I'm on page {string}", async ({ page }, path: string) => {
  await page.goto(path, { waitUntil: 'networkidle' });
});

Given("All popups are closed", async ({ page }) => {
  await suppressInterferences(page);
});
