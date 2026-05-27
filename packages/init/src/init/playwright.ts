import { confirm, isCancel, log, note, spinner } from '@clack/prompts';
import { hasExplicitInitSelections } from '../init-options.js';
import {
  hasPlaywrightBrowsers,
  installPlaywright,
  installPlaywrightBrowsers,
  isPlaywrightInstalled,
} from '../setup/playwright.js';
import type { InitContext } from './context.js';

const PLAYWRIGHT_EXPLANATION = [
  'Playwright is the browser automation engine letsrunit uses to click, type, inspect pages, and capture artifacts.',
  'This installs @playwright/test and a Chromium browser so tests can run against your app.',
].join('\n');

type PlaywrightContext = Pick<InitContext, 'env' | 'options'>;

function assertNotCanceled<T>(value: T | symbol): T {
  if (isCancel(value)) throw new Error('Initialization canceled.');
  return value;
}

async function shouldSetupPlaywright(context: PlaywrightContext): Promise<boolean> {
  if (hasExplicitInitSelections(context.options)) return Boolean(context.options.withPlaywright);

  note(PLAYWRIGHT_EXPLANATION, 'Playwright');
  return assertNotCanceled(
    await confirm({ message: 'Set up browser runtime (Playwright Chromium)?', initialValue: true }),
  );
}

export async function setupPlaywright(context: PlaywrightContext): Promise<void> {
  if (!(await shouldSetupPlaywright(context))) return;

  const env = context.env;
  if (!isPlaywrightInstalled(env)) {
    const install = spinner();
    install.start('Installing @playwright/test…');
    installPlaywright(env);
    install.stop('@playwright/test installed');
  } else {
    log.success('@playwright/test already installed');
  }

  if (hasPlaywrightBrowsers(env)) {
    log.success('Playwright Chromium already installed');
    return;
  }

  const s = spinner();
  s.start('Installing Playwright Chromium…');
  installPlaywrightBrowsers(env);
  s.stop('Playwright Chromium installed');
}
