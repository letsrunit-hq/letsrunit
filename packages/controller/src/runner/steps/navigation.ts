import { Given, Then, World } from '../dsl';
import { suppressInterferences } from '../../playwright/suppress-interferences';
import { waitForIdle } from '../../playwright/wait';
import { getLang } from '../../utils/get-lang';
import { expect } from '@playwright/test';
import { splitUrl } from '../../utils/split-url';

async function openPage(world: World, path: string): Promise<void> {
  const { page } = world;

  await page.goto(path);
  await waitForIdle(page);

  world.lang = await getLang(page) || undefined;
}

Given("I'm on the homepage", async (world) => openPage(world, '/'));
Given("I'm on page {string}", async (world, path: string) => {
  if (path.includes(':') && world.options?.baseURL && splitUrl(path).base !== world.options!.baseURL) {
    throw new Error(`Not allowed to navigate away from "${world.options!.baseURL}"`);
  }

  return await openPage(world, path);
});

Given("all popups are closed", async ({ page, lang }) => {
  await suppressInterferences(page, { lang });
});

Then("I should be on page {string}", async ({ page, options }, path: string): Promise<void> => {
  await page.waitForLoadState('load');

  if (path.includes(':')) {
    expect(page.url()).toEqual(path);
  } else {
    const { path: actualPath } = splitUrl(page.url());
    expect(actualPath).toEqual(actualPath);
  }
});
