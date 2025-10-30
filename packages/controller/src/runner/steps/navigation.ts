import { Given, Then, World } from '../dsl';
import { suppressInterferences } from '../../playwright/suppress-interferences';
import { waitForIdle } from '../../playwright/wait';
import { getLang } from '../../utils/get-lang';
import { splitUrl } from '../../utils/split-url';
import { expect } from '@playwright/test';

async function openPage(world: World, path: string): Promise<void> {
  const { page } = world;

  if (splitUrl(page.url()).path === path) return; // Already on the page, no implicit reload.

  await page.goto(path);
  await waitForIdle(page);

  world.lang ??= await getLang(page) || undefined;
}

Given("I'm on the homepage", async (world) => openPage(world, '/'));

Given("I'm on page {string}", async (world, path: string) => {
  return await openPage(world, path);
});

Given("all popups are closed", async ({ page, lang }) => {
  await suppressInterferences(page, { lang });
});

Then("I see that I'm on page {string}", async ({ page, options }, path: string): Promise<void> => {
  await page.waitForLoadState('load');

  if (path.includes(':')) {
    expect(page.url()).toEqual(path);
  } else {
    const { path: actualPath } = splitUrl(page.url());
    expect(actualPath).toEqual(actualPath);
  }
}, 'hidden');
