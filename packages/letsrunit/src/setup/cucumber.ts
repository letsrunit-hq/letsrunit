import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PackageManager } from '../detect.js';

const BDD_IMPORT = '@letsrunit/bdd/define';

const CUCUMBER_CONFIG = `export default {
  timeout: 30_000,
  worldParameters: {
    baseURL: 'http://localhost:3000',
  },
};
`;

const SUPPORT_FILE = `import '${BDD_IMPORT}';
`;

const EXAMPLE_FEATURE = `Feature: Example
  Scenario: Homepage loads
    Given I'm on the homepage
    Then The page contains text "Welcome"
`;

export function installCucumber(pm: PackageManager, cwd: string): void {
  const cmd =
    pm === 'yarn'
      ? 'yarn add --dev @cucumber/cucumber'
      : pm === 'pnpm'
        ? 'pnpm add -D @cucumber/cucumber'
        : pm === 'bun'
          ? 'bun add -d @cucumber/cucumber'
          : 'npm install --save-dev @cucumber/cucumber';

  execSync(cmd, { stdio: 'inherit', cwd });
}

function installBdd(pm: PackageManager, cwd: string): boolean {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return false;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

  const alreadyInstalled =
    '@letsrunit/bdd' in (pkg.devDependencies ?? {}) || '@letsrunit/bdd' in (pkg.dependencies ?? {});

  if (alreadyInstalled) return false;

  const cmd =
    pm === 'yarn'
      ? 'yarn add --dev @letsrunit/bdd'
      : pm === 'pnpm'
        ? 'pnpm add -D @letsrunit/bdd'
        : pm === 'bun'
          ? 'bun add -d @letsrunit/bdd'
          : 'npm install --save-dev @letsrunit/bdd';

  execSync(cmd, { stdio: 'inherit', cwd });
  return true;
}

type CucumberConfigResult = 'created' | 'skipped' | 'needs-manual-update';

function setupCucumberConfig(cwd: string): CucumberConfigResult {
  const supportDir = join(cwd, 'features', 'support');
  const supportPath = join(supportDir, 'world.js');

  if (existsSync(supportPath)) {
    const content = readFileSync(supportPath, 'utf-8');
    if (content.includes(BDD_IMPORT)) return 'skipped';
    return 'needs-manual-update';
  }

  // Create a minimal cucumber.js if it doesn't exist
  const configPath = join(cwd, 'cucumber.js');
  if (!existsSync(configPath)) {
    writeFileSync(configPath, CUCUMBER_CONFIG, 'utf-8');
  }

  // Create the support file that imports the step definitions
  mkdirSync(supportDir, { recursive: true });
  writeFileSync(supportPath, SUPPORT_FILE, 'utf-8');
  return 'created';
}

function setupFeaturesDir(cwd: string): boolean {
  if (existsSync(join(cwd, 'features'))) {
    // features/ exists but check if there are any feature files
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

export interface CucumberSetupResult {
  bddInstalled: boolean;
  configResult: CucumberConfigResult;
  featuresCreated: boolean;
}

export function setupCucumber(pm: PackageManager, cwd: string): CucumberSetupResult {
  const bddInstalled = installBdd(pm, cwd);
  const configResult = setupCucumberConfig(cwd);
  const featuresCreated = setupFeaturesDir(cwd);
  return { bddInstalled, configResult, featuresCreated };
}
