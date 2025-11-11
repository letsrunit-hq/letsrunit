import { runner } from './runner';
import { browse, snapshot } from '@letsrunit/playwright';
import type { Result, World } from './types';
import { createFieldEngine, parseFeature } from '@letsrunit/gherkin';
import { type Browser, type BrowserContextOptions, chromium, selectors } from '@playwright/test';
import { Journal } from '@letsrunit/journal';
import { ParsedStep } from '@letsrunit/gherker/src/types';

export interface ControllerOptions extends BrowserContextOptions {
  headless?: boolean;
  debug?: boolean;
  journal?: Journal;
}

export class Controller {
  private constructor(
    private browser: Browser,
    private world: World,
    readonly journal: Journal,
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

    const journal = options.journal ?? Journal.nil();

    return new Controller(browser, { page, options }, journal);
  }

  async run(feature: string): Promise<Result> {
    await this.logFeature(feature);

    const { world: _, ...result } = await runner.run(
      feature,
      this.world,
      async (step, status, reason) => {
        await this.journal.batch()
          .log(step, { type: status })
          .error(reason?.message)
          .flush();
      },
    );
    const page = await snapshot(this.world.page);

    return { ...result, page };
  }

  validate(feature: string): { valid: boolean, steps: ParsedStep[] } {
    const steps = runner.parse(feature);
    const valid = steps.every((step) => !!step.def);

    return { valid, steps };
  }

  private async logFeature(feature: string): Promise<void> {
    const journal = this.journal.batch();
    const { name, description, background, steps } = parseFeature(feature);

    try {
      if (name) journal.title(name);
      if (description) journal.info(description);

      for (const step of [...(background ?? []), ...steps]) {
        journal.prepare(step);
      }
    } finally {
      await journal.flush();
    }
  }

  async close(): Promise<void> {
    await this.browser.close();
  }

  listSteps(type?: 'Given' | 'When' | 'Then'): string[] {
    return runner.defs
      .filter((def) => def.comment !== 'hidden' && (!type || def.type === type))
      .map((def) => `${def.type} ${def.source}` + (def.comment ? `  # ${def.comment}` : ''));
  }
}
