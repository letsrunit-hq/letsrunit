import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PackageManager } from '../detect.js';

const BDD_IMPORT = '@letsrunit/bdd/define';

const CUCUMBER_CONFIG = `export default {
  import: ['${BDD_IMPORT}'],
};
`;

const EXAMPLE_FEATURE = `Feature: Example
  Scenario: Visit example.com
    Given I open "https://example.com"
    Then I should see "Example Domain"
`;

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
  const configPath = join(cwd, 'cucumber.js');

  if (!existsSync(configPath)) {
    writeFileSync(configPath, CUCUMBER_CONFIG, 'utf-8');
    return 'created';
  }

  const content = readFileSync(configPath, 'utf-8');
  if (content.includes(BDD_IMPORT)) return 'skipped';

  return 'needs-manual-update';
}

function setupFeaturesDir(cwd: string): boolean {
  if (existsSync(join(cwd, 'features'))) return false;

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
