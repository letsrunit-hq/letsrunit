import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { confirm, isCancel, log, note, spinner } from '@clack/prompts';
import { hasExplicitInitSelections } from '../init-options.js';
import { installCucumber, setupCucumber } from '../setup/cucumber.js';
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
  return assertNotCanceled(await confirm({ message: 'Install and scaffold Cucumber support?', initialValue: true }));
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
  const result = setupCucumber(env, { baseUrl: context.baseUrl ?? DEFAULT_BASE_URL });

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
  const requested = await shouldSetupCucumber(context);
  if (requested) applyCucumberInstall(context);
  if (context.env.hasCucumber || requested) applyCucumberSetup(context);
}
