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

  const hasPackage = isPlaywrightInstalled(context.env);
  const hasBrowsers = hasPlaywrightBrowsers(context.env);
  if (hasPackage && hasBrowsers) {
    log.success('Playwright runtime already installed');
    return false;
  }

  note(PLAYWRIGHT_EXPLANATION, 'Playwright');
  const message = hasPackage
    ? 'Install Playwright Chromium browser?'
    : hasBrowsers
      ? 'Install @playwright/test?'
      : 'Set up browser runtime (Playwright Chromium)?';
  return assertNotCanceled(await confirm({ message, initialValue: true }));
}

export async function setupPlaywright(context: PlaywrightContext): Promise<void> {
  const env = context.env;
  if (!(await shouldSetupPlaywright(context))) return;

  const hasPackage = isPlaywrightInstalled(env);
  const hasBrowsers = hasPlaywrightBrowsers(env);

  if (!hasPackage) {
    const install = spinner();
    install.start('Installing @playwright/test…');
    installPlaywright(env);
    install.stop('@playwright/test installed');
  }

  if (hasBrowsers) return;

  const s = spinner();
  s.start('Installing Playwright Chromium…');
  installPlaywrightBrowsers(env);
  s.stop('Playwright Chromium installed');
}
