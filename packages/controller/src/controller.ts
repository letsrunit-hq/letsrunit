import { runner } from './runner';
import { browse } from './playwright/browser';
import { snapshot } from './playwright/snapshot';
import type { World } from './runner/dsl';
import type { Snapshot } from './types';
import { type Browser, type BrowserContextOptions, chromium } from '@playwright/test';

interface Options extends BrowserContextOptions {
  headless?: boolean;
}

export class Controller {
  private constructor(
    private browser: Browser,
    private world: World,
  ) {}

  static async launch(options: Options = {}): Promise<Controller> {
    const browser = await chromium.launch({ headless: options.headless ?? true });
    const page = await browse(browser, options);

    return new Controller(browser, { page });
  }

  async run(feature: string): Promise<Snapshot> {
    await runner.run(feature, this.world);
    return await snapshot(this.world.page);
  }

  async close(): Promise<void> {
    await this.browser.close();
  }
}

export function listSteps() {
  return runner.defs.map((def) => `${def.type} ${def.expr}`);
}
