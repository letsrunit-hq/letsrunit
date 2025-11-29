import type { Argument } from '@cucumber/cucumber-expressions';
import type { StepDescription, StepResult } from '@letsrunit/gherker';
import { ParsedStep } from '@letsrunit/gherker/src/types';
import { createFieldEngine, parseFeature } from '@letsrunit/gherkin';
import { Journal } from '@letsrunit/journal';
import { browse, locator, screenshot, snapshot } from '@letsrunit/playwright';
import { scrollToCenter } from '@letsrunit/playwright/src/scroll';
import { clean } from '@letsrunit/utils';
import {
  type Browser,
  type BrowserContextOptions,
  chromium,
  type Locator,
  type Page,
  type PageScreenshotOptions,
  selectors,
} from '@playwright/test';
import { File } from 'node:buffer';
import { runner } from './runner';
import type { Result, World } from './types';

export interface ControllerOptions extends BrowserContextOptions {
  headless?: boolean;
  debug?: boolean;
  journal?: Journal;
}

export class Controller {
  static fieldSelectorIsRegistered: boolean = false;

  private constructor(
    private browser: Browser,
    private world: World,
    readonly journal: Journal,
  ) {}

  static async registerFieldSelector() {
    if (this.fieldSelectorIsRegistered) return;
    try {
      await selectors.register('field', createFieldEngine);
    } catch {}
  }

  static async launch(options: ControllerOptions = {}): Promise<Controller> {
    await this.registerFieldSelector();

    const browser = await chromium.launch({ headless: options.headless ?? true });
    const page = await browse(browser, options);

    if (options.debug) {
      page.on('console', (msg) => {
        console.log('[page]', msg.type(), msg.text());
      });
    }

    const journal = options.journal ?? Journal.nil();

    return new Controller(browser, { page, options }, journal);
  }

  async run(feature: string): Promise<Result> {
    await this.logFeature(feature);

    const { world: _, ...result } = await runner.run(feature, this.world, (...args) => this.runStep(...args));
    const page = await snapshot(this.world.page);

    return { ...result, page };
  }

  validate(feature: string): { valid: boolean; steps: ParsedStep[] } {
    const steps = runner.parse(feature);
    const valid = steps.every((step) => !!step.def);

    return { valid, steps };
  }

  async close(): Promise<void> {
    await this.browser.close();
  }

  listSteps(type?: 'Given' | 'When' | 'Then'): string[] {
    return runner.defs
      .filter((def) => def.comment !== 'hidden' && (!type || def.type === type))
      .map((def) => `${def.type} ${def.source}` + (def.comment ? `  # ${def.comment}` : ''));
  }

  private async runStep(step: StepDescription, run: () => Promise<StepResult>): Promise<StepResult> {
    const locators = await this.getLocatorArgs(this.world.page, step.args);
    if (locators.length > 0) {
      await scrollToCenter(locators[0]);
    }

    const screenshotBefore = await this.makeScreenshot({ mask: locators });
    await this.journal.start(step.text, { artifacts: clean([screenshotBefore]) });

    const result = await run();

    const screenshotAfter =
      !step.text.startsWith('Then') && (await this.areAllVisible(locators))
        ? await this.makeScreenshot({ mask: locators })
        : undefined;

    await this.journal
      .batch()
      .log(step.text, { type: result.status, artifacts: clean([screenshotAfter]) })
      .error(result.reason?.message)
      .flush();

    return result;
  }

  private async makeScreenshot(options?: PageScreenshotOptions): Promise<File | undefined> {
    try {
      return await screenshot(this.world.page, options);
    } catch (e) {
      const message = (e as any).message ?? String(e);
      await this.journal.warn(`Failed to take screenshot of ${this.world.page.url()}: ${message}`, {
        meta: { reason: e },
      });
    }
  }

  private async getLocatorArgs(page: Page, args: readonly Argument[]): Promise<Locator[]> {
    const promises = args
      .filter((arg) => arg.getParameterType().name === 'locator')
      .map((arg) => arg.getValue<string>(null))
      .filter((arg) => arg !== null)
      .map((arg) => locator(page, arg));

    return Promise.all(promises);
  }

  private async areAllVisible(locators: Locator[]): Promise<boolean> {
    const visible = await Promise.all(locators.map((l) => l.isVisible()));
    return visible.every(Boolean);
  }

  private async logFeature(feature: string): Promise<void> {
    const journal = this.journal.batch();
    const { name, description, background, steps } = parseFeature(feature);

    try {
      if (name) journal.title(name);
      if (description) journal.info(description);

      for (const step of [...(background ?? []), ...steps]) {
        journal.prepare(step, { meta: { source: 'gherkin' } });
      }
    } finally {
      await journal.flush();
    }
  }
}
