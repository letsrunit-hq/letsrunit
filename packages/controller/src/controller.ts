import { runner } from './runner';
import { browse } from './playwright/browser';
import { snapshot } from './playwright/snapshot';
import type { World } from './runner/dsl';
import type { Snapshot } from './types';
import { createFieldEngine } from '@letsrunit/gherkin';
import { type Browser, type BrowserContextOptions, chromium, selectors } from '@playwright/test';

export interface ControllerOptions extends BrowserContextOptions {
  headless?: boolean;
  debug?: boolean;
}

export class Controller {
  private constructor(
    private browser: Browser,
    private world: World,
  ) {}

  static async launch(options: ControllerOptions = {}): Promise<Controller> {
    await selectors.register('field', createFieldEngine);

    const browser = await chromium.launch({ headless: options.headless ?? true });
    const page = await browse(browser, options);

    if (options.debug) {
      page.on('console', msg => {
        console.log('[page]', msg.type(), msg.text());
      });
    }

    return new Controller(browser, { page, options });
  }

  async run(feature: string): Promise<Snapshot> {
    await runner.run(feature, this.world);
    return await snapshot(this.world.page);
  }

  async close(): Promise<void> {
    await this.browser.close();
  }

  listSteps(type?: 'Given' | 'When' | 'Then'): string[] {
    return runner.defs
      .filter((def) => def.comment !== 'hidden' && (!type || def.type === type))
      .map((def) => `${def.type} ${def.expr.source}` + (def.comment ? `  # ${def.comment}` : ''));
  }
}
