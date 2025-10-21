import { runner } from './runner';
import { browse } from './playwright/browser';
import { World } from './runner/dsl';
import { type BrowserContextOptions, chromium } from '@playwright/test';

interface Options extends BrowserContextOptions {
  headless?: boolean;
}

export async function run(feature: string, options: Options = {}) {
  const browser = await chromium.launch({ headless: options.headless ?? true });

  try {
    const { page } = await runner.run(feature, async (): Promise<World> => {
      const page = await browse(browser);
      return { page };
    });

    return {
      url: page.url(),
      content: await page.content(),
    };
  } finally {
    await browser.close();
  }
}

export function listSteps() {
  return runner.defs.map((def) => `${def.type} ${def.expr}`);
}
