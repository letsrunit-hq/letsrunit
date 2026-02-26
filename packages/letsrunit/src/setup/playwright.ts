import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { type Environment, execPm } from '../detect.js';

export function hasPlaywrightBrowsers({ cwd }: Pick<Environment, 'cwd'>): boolean {
  if (!existsSync(join(cwd, 'node_modules', 'playwright-core', 'package.json'))) {
    return false;
  }
  try {
    const execPath = execSync(
      `node -e "console.log(require('playwright-core').chromium.executablePath())"`,
      { cwd, stdio: 'pipe', encoding: 'utf-8' },
    ).trim();
    return existsSync(execPath);
  } catch {
    return false;
  }
}

export function installPlaywrightBrowsers(env: Pick<Environment, 'packageManager' | 'cwd'>): void {
  execPm(env, {
    npm: 'exec playwright install chromium',
    yarn: 'exec playwright install chromium',
    pnpm: 'exec playwright install chromium',
    bun: 'x playwright install chromium',
  });
}
