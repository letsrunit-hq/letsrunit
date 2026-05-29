import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Environment, execPm } from '../detect.js';

const PLAYWRIGHT_TEST_VERSION = '1.58.2';

export function isPlaywrightInstalled({ cwd }: Pick<Environment, 'cwd'>): boolean {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return false;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

  return '@playwright/test' in (pkg.devDependencies ?? {}) || '@playwright/test' in (pkg.dependencies ?? {});
}

export function hasPlaywrightBrowsers({ cwd }: Pick<Environment, 'cwd'>): boolean {
  if (!existsSync(join(cwd, 'node_modules', 'playwright-core', 'package.json'))) {
    return false;
  }
  try {
    const execPath = execSync(`node -e "console.log(require('playwright-core').chromium.executablePath())"`, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();
    return existsSync(execPath);
  } catch {
    return false;
  }
}

export function installPlaywright(env: Pick<Environment, 'packageManager' | 'cwd'>): void {
  const spec = `@playwright/test@${PLAYWRIGHT_TEST_VERSION}`;

  execPm(env, {
    npm: `install --save-dev --save-exact ${spec}`,
    yarn: `add --dev --exact ${spec}`,
    pnpm: `add -D --save-exact ${spec}`,
    bun: `add -d --exact ${spec}`,
  });
}

export function installPlaywrightBrowsers(env: Pick<Environment, 'packageManager' | 'cwd'>): void {
  execPm(env, {
    npm: 'exec playwright install chromium',
    yarn: 'exec playwright install chromium',
    pnpm: 'exec playwright install chromium',
    bun: 'x playwright install chromium',
  });
}
