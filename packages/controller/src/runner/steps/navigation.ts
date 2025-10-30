import { Given, Then, World } from '../dsl';
import { suppressInterferences } from '../../playwright/suppress-interferences';
import { waitForIdle } from '../../playwright/wait';
import { getLang } from '../../utils/get-lang';
import { pathRegexp, splitUrl } from '../../utils/split-url';
import { expect } from '@playwright/test';
import { eventually } from '../../utils/sleep';

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

Then("I should be on page {string}", (world, expectedPath: string) => eventually(async () => {
  const { page } = world;
  const { path: actualPath } = splitUrl(page.url());

  if (expectedPath.includes(':')) {
    const { regexp, names } = pathRegexp(expectedPath);

    expect(actualPath, `Expected path ${actualPath} to match pattern ${expectedPath}`).toMatch(regexp);

    const match = actualPath.match(regexp);
    world.params = Object.fromEntries(names.map((name, i) => [name, decodeURIComponent(match![i + 1])]));
  } else {
    expect(actualPath).toEqual(expectedPath);
    world.params = {};
  }
}), 'hidden');
