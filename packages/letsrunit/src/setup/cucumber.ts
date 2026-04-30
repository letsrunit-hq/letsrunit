import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Environment, execPm } from '../detect.js';

const BDD_IMPORT = '@letsrunit/cucumber';

function cucumberConfig(baseUrl: string): string {
  return `import { isAgentEnvironment, resolveDebugWorldParameters } from '@letsrunit/cucumber/config';

const { failFast, worldParameters } = resolveDebugWorldParameters({
  argv: process.argv,
  baseWorldParameters: {
    baseURL: '${baseUrl}',
  },
});

const format = [
  isAgentEnvironment(process.env)
    ? '@letsrunit/cucumber/agent'
    : '@letsrunit/cucumber/progress',
];

export default {
  require: ['features/support/**/*.js'],
  format,
  failFast,
  plugin: ['@letsrunit/cucumber/store'],
  pluginOptions: {
    letsrunitStore: {
      directory: '.letsrunit',
    },
  },
  worldParameters,
  letsrunit: {
    ignore: ['features/support/world.js'],
  },
};
`;
}

const SUPPORT_FILE = `import { setDefaultTimeout } from '@cucumber/cucumber';
import '${BDD_IMPORT}';

setDefaultTimeout(30_000);
`;

const EXAMPLE_FEATURE = `Feature: Example
  Scenario: Homepage loads
    Given I'm on the homepage
`;

export type CucumberConfigResult = 'created' | 'skipped' | 'needs-manual-update';

export interface CucumberSetupResult {
  bddInstalled: boolean;
  configResult: CucumberConfigResult;
  featuresCreated: boolean;
}

export function installCucumber(env: Pick<Environment, 'packageManager' | 'cwd'>): void {
  execPm(env, {
    npm: 'install --save-dev @cucumber/cucumber',
    yarn: 'add --dev @cucumber/cucumber',
    pnpm: 'add -D @cucumber/cucumber',
    bun: 'add -d @cucumber/cucumber',
  });
}

function installBdd(env: Pick<Environment, 'packageManager' | 'cwd'>): boolean {
  const pkgPath = join(env.cwd, 'package.json');
  if (!existsSync(pkgPath)) return false;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

  const alreadyInstalled =
    '@letsrunit/cucumber' in (pkg.devDependencies ?? {}) || '@letsrunit/cucumber' in (pkg.dependencies ?? {});

  if (alreadyInstalled) return false;

  execPm(env, {
    npm: 'install --save-dev @letsrunit/cucumber',
    yarn: 'add --dev @letsrunit/cucumber',
    pnpm: 'add -D @letsrunit/cucumber',
    bun: 'add -d @letsrunit/cucumber',
  });

  return true;
}

function setupCucumberConfig({ cwd }: Pick<Environment, 'cwd'>, baseUrl: string): CucumberConfigResult {
  const supportDir = join(cwd, 'features', 'support');
  const supportPath = join(supportDir, 'world.js');

  if (existsSync(supportPath)) {
    const content = readFileSync(supportPath, 'utf-8');
    if (content.includes(BDD_IMPORT)) return 'skipped';
    return 'needs-manual-update';
  }

  const configPath = join(cwd, 'cucumber.js');
  if (!existsSync(configPath)) {
    writeFileSync(configPath, cucumberConfig(baseUrl), 'utf-8');
  }

  mkdirSync(supportDir, { recursive: true });
  writeFileSync(supportPath, SUPPORT_FILE, 'utf-8');
  return 'created';
}

function setupFeaturesDir({ cwd }: Pick<Environment, 'cwd'>): boolean {
  if (existsSync(join(cwd, 'features'))) {
    try {
      const hasFeatureFiles = readdirSync(join(cwd, 'features')).some((f) => f.endsWith('.feature'));
      if (hasFeatureFiles) return false;
    } catch {
      return false;
    }
  }

  try {
    const hasFeatureAtRoot = readdirSync(cwd).some((f) => f.endsWith('.feature'));
    if (hasFeatureAtRoot) return false;
  } catch {
    return false;
  }

  mkdirSync(join(cwd, 'features'), { recursive: true });
  writeFileSync(join(cwd, 'features', 'example.feature'), EXAMPLE_FEATURE, 'utf-8');
  return true;
}

export function setupCucumber(
  env: Pick<Environment, 'packageManager' | 'cwd'>,
  options: { baseUrl?: string } = {},
): CucumberSetupResult {
  const bddInstalled = installBdd(env);
  const configResult = setupCucumberConfig(env, options.baseUrl ?? 'http://localhost:3000');
  const featuresCreated = setupFeaturesDir(env);
  return { bddInstalled, configResult, featuresCreated };
}
