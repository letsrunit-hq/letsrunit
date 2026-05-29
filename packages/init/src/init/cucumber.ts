import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { confirm, isCancel, log, note, spinner } from '@clack/prompts';
import { hasExplicitInitSelections } from '../init-options.js';
import { installCucumber, setupCucumber as scaffoldCucumber } from '../setup/cucumber.js';
import type { InitContext } from './context.js';

const BDD_IMPORT = '@letsrunit/cucumber';
const DEFAULT_BASE_URL = 'http://localhost:3000';
const CUCUMBER_EXPLANATION = [
  'Cucumber is the test runner for .feature files written in Gherkin, such as "Given I am on the homepage".',
  'Letsrunit adds @cucumber/cucumber, a cucumber.js config, and a support file that registers the built-in browser steps from @letsrunit/cucumber.',
].join('\n');

type CucumberContext = Pick<InitContext, 'env' | 'options' | 'baseUrl'>;

function assertNotCanceled<T>(value: T | symbol): T {
  if (isCancel(value)) throw new Error('Initialization canceled.');
  return value;
}

async function shouldSetupCucumber(context: CucumberContext): Promise<boolean> {
  if (hasExplicitInitSelections(context.options)) return Boolean(context.options.withCucumber);

  note(CUCUMBER_EXPLANATION, 'Cucumber');
  const message = context.env.hasCucumber ? 'Scaffold Cucumber support?' : 'Install and scaffold Cucumber support?';
  return assertNotCanceled(await confirm({ message, initialValue: true }));
}

function hasLetsrunitSupport(cwd: string): boolean {
  const supportPath = join(cwd, 'features', 'support', 'world.js');
  if (!existsSync(supportPath)) return false;
  return readFileSync(supportPath, 'utf-8').includes(BDD_IMPORT);
}

function isCucumberConfigured(context: CucumberContext): boolean {
  return context.env.hasCucumber && hasLetsrunitSupport(context.env.cwd);
}

function applyCucumberInstall(context: CucumberContext): void {
  const env = context.env;
  if (env.hasCucumber) {
    log.success('@cucumber/cucumber already installed');
    return;
  }

  const s = spinner();
  s.start('Installing @cucumber/cucumber…');
  installCucumber(env);
  s.stop('@cucumber/cucumber installed');
}

function applyCucumberSetup(context: CucumberContext): void {
  const env = context.env;
  const hadCucumberConfig = existsSync(join(env.cwd, 'cucumber.js'));
  const result = scaffoldCucumber(env, { baseUrl: context.baseUrl ?? DEFAULT_BASE_URL });

  if (result.bddInstalled) log.success('@letsrunit/cucumber installed');

  if (result.configResult === 'created') {
    log.success('features/support/world.js created');
  } else if (result.configResult === 'needs-manual-update') {
    log.warn('features/support/world.js exists but does not import @letsrunit/cucumber.');
    note(`Add "import '${BDD_IMPORT}';" to features/support/world.js`, 'Action required');
  }

  if (hadCucumberConfig) {
    note(
      'cucumber.js already exists, so init did not modify it. Add `process.env.LETSRUNIT_BASE_URL` as the baseURL fallback manually if needed.',
      'Cucumber config',
    );
  }

  if (result.featuresCreated) log.success('features/ directory created with example.feature');
}

export async function setupCucumber(context: CucumberContext): Promise<void> {
  if (isCucumberConfigured(context)) {
    log.success('Cucumber support already configured');
    return;
  }

  const requested = await shouldSetupCucumber(context);
  if (requested) {
    applyCucumberInstall(context);
    applyCucumberSetup(context);
    return;
  }

  if (hasExplicitInitSelections(context.options) && context.env.hasCucumber) {
    applyCucumberSetup(context);
  }
}
