import { suppressInterferences, waitForIdle } from '@letsrunit/playwright';
import { expect } from '@playwright/test';
import { getLang } from '../utils/get-lang';
import { eventually, pathRegexp, splitUrl } from '@letsrunit/utils';
import { World } from '../types';
import { Given, Then } from './wrappers';

async function openPage(world: World, path: string): Promise<void> {
  const { page } = world;

  const result = await page.goto(path);
  expect(result?.status()).toBeLessThan(400);

  await waitForIdle(page);

  world.lang ??= (await getLang(page)) || undefined;
}

export const navHome = Given("I'm on the homepage", async (world) => openPage(world, '/'));

export const navPath = Given("I'm on page {string}", async (world, path: string) => {
  return await openPage(world, path);
});

export const popupClosed = Given('all popups are closed', async ({ page, lang }) => {
  await suppressInterferences(page, { lang });
});

export const assertPath = Then('I should be on page {string}', (world, expectedPath: string) =>
  eventually(async () => {
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
  }),
);
