import { Given, World } from '../dsl';
import { suppressInterferences } from '../../playwright/suppress-interferences';
import { waitForIdle } from '../../playwright/wait';
import { getLang } from '../../utils/get-lang';

async function openPage(world: World, path: string): Promise<void> {
  const { page } = world;

  await page.goto(path);
  await waitForIdle(page);

  world.lang = await getLang(page) || undefined;
}

Given("I'm on the homepage", async (world) => openPage(world, '/'));
Given("I'm on page {string}", openPage);

Given("all popups are closed", async ({ page, lang }) => {
  await suppressInterferences(page, { lang });
});
