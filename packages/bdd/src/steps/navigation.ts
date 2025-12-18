import { suppressInterferences, waitForIdle } from '@letsrunit/playwright';
import { eventually, pathRegexp, splitUrl } from '@letsrunit/utils';
import { expect } from '@playwright/test';
import { World } from '../types';
import { getLang } from '../utils/get-lang';
import { Given, Then, When } from './wrappers';

async function openPage(world: World, path: string): Promise<void> {
  const { page } = world;

  const result = await page.goto(path);
  expect(result?.status()).toBeLessThan(400);

  await waitForIdle(page);

  world.lang ??= (await getLang(page)) || undefined;
}

export const navHome = Given("I'm on the homepage", async function () {
  await openPage(this, '/');
});

export const navPath = Given("I'm on page {string}", async function (path: string) {
  await openPage(this, path);
});

export const popupClosed = Given('all popups are closed', async function (){
  await suppressInterferences(this.page, { lang: this.lang?.code });
});

export const assertPath = Then('I should be on page {string}', async function (expectedPath: string) {
  await eventually(async () => {
    const { path: actualPath } = splitUrl(this.page.url());

    if (expectedPath.includes(':')) {
      const { regexp, names } = pathRegexp(expectedPath);

      expect(actualPath, `Expected path ${actualPath} to match pattern ${expectedPath}`).toMatch(regexp);

      const match = actualPath.match(regexp);
      this.pathParams = Object.fromEntries(names.map((name, i) => [name, decodeURIComponent(match![i + 1])]));
    } else {
      expect(actualPath).toEqual(expectedPath);
      delete this.pathParams;
    }
  });
});

export const back = When('I go back to the previous page', async function () {
  await this.page.goBack();
  await waitForIdle(this.page);
});
