import { Then } from '../dsl';

Then("I take a screenshot", async ({ page }) => {
  const image = await page.screenshot();
});
