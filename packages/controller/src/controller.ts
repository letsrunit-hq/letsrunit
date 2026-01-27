import type { Argument } from '@cucumber/cucumber-expressions';
import { toFile, type World } from '@letsrunit/bdd';
import type { ParsedStep, StepDescription, StepResult } from '@letsrunit/gherker';
import { parseFeature } from '@letsrunit/gherkin';
import { Journal } from '@letsrunit/journal';
import {
  browse,
  createDateEngine,
  createFieldEngine,
  formatHtml,
  locator,
  screenshot,
  scrollToCenter,
  snapshot,
} from '@letsrunit/playwright';
import { clean, hashKey, omit, type RequireOnly } from '@letsrunit/utils';
import {
  type Browser,
  type BrowserContextOptions,
  chromium,
  type Locator,
  type Page,
  type PageScreenshotOptions,
  selectors,
} from '@playwright/test';
import { runner } from './runner';
import type { Result } from './types';

export interface ControllerOptions extends BrowserContextOptions {
  headless?: boolean;
  debug?: boolean;
  journal?: Journal;
}

export interface RunOptions {
  signal?: AbortSignal;
}

export class Controller {
  static fieldSelectorIsRegistered: boolean = false;

  private constructor(
    private browser: Browser,
    private world: World,
    readonly journal: Journal,
    private readonly pendingArtifacts: Set<File>,
  ) {}

  get lang(): { code: string; name: string } | null {
    return this.world.lang ?? null;
  }

  static async registerFieldSelector() {
    if (this.fieldSelectorIsRegistered) return;
    try {
      await selectors.register('field', createFieldEngine);
      await selectors.register('date', createDateEngine);
    } catch {}
  }

  static createWorld(
    page: Page,
    options: RequireOnly<ControllerOptions, 'journal'>,
    pendingArtifacts: Set<File>,
  ): World {
    const journal = options.journal;

    return {
      page,
      parameters: omit(options, ['headless', 'journal', 'debug']),
      startTime: Date.now(),
      async attach(data, options) {
        pendingArtifacts.add(toFile(data, options));
      },
      async link(text: string) {
        await journal.info(text);
      },
      async log(text: string) {
        await journal.info(text);
      },
    };
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
    const pendingArtifacts = new Set<File>();
    const world = this.createWorld(page, { ...options, journal }, pendingArtifacts);

    return new Controller(browser, world, journal, pendingArtifacts);
  }

  async run(feature: string, opts: RunOptions = {}): Promise<Result> {
    await this.logFeature(feature);

    const { world: _, ...result } = await runner.run(feature, this.world, (...args) => this.runStep(...args), opts);
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
    const locators = !step.text.match(/\b(don't see|not contains)\b/i)
      ? await this.getLocatorArgs(this.world.page, step.args)
      : [];

    if (locators.length > 0) {
      await scrollToCenter(locators[0]);
    }

    const urlBefore = this.world.page.url();
    const screenshotBefore = urlBefore !== 'about:blank' ? await this.makeScreenshot({ mask: locators }) : undefined;
    const htmlBefore = await this.makeHtmlFile();
    await this.journal.start(step.text, { artifacts: clean([screenshotBefore, htmlBefore]) });

    const result = await run();

    const urlAfter = this.world.page.url();
    const screenshotAfter =
      (!screenshotBefore && urlAfter !== 'about:blank') ||
      (!step.text.startsWith('Then') && urlAfter === urlBefore && (await this.areAllVisible(locators)))
        ? await this.makeScreenshot({ mask: locators })
        : undefined;

    await this.journal
      .batch()
      .log(step.text, {
        type: result.status,
        artifacts: clean([screenshotAfter, ...this.pendingArtifacts]),
      })
      .error(result.reason?.message)
      .flush();

    this.pendingArtifacts.clear();

    return result;
  }

  private async makeHtmlFile(): Promise<File | undefined> {
    try {
      const html = await formatHtml(this.world.page);
      const filename = await hashKey('{hash}.html', html);
      return new File([html], filename, { type: 'text/html' });
    } catch (e) {
      const message = (e as any).message ?? String(e);
      await this.journal.warn(`Failed to get HTML of ${this.world.page.url()}: ${message}`, {
        meta: { reason: e },
      });
    }
  }

  private async makeScreenshot(options?: PageScreenshotOptions): Promise<File | undefined> {
    try {
      const mask = (
        await Promise.all(options?.mask?.map((loc) => loc.isVisible().then((v) => (v ? loc : null))) ?? [])
      ).filter(Boolean) as Locator[];

      return await screenshot(this.world.page, { ...options, mask });
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
    if (locator.length === 0) return true;

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
        journal.prepare(step);
      }
    } finally {
      await journal.flush();
    }
  }
}
