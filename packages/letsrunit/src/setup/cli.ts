import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Environment, execPm } from '../detect.js';

export function isCliInstalled({ cwd }: Pick<Environment, 'cwd'>): boolean {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return false;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

  return '@letsrunit/cli' in (pkg.devDependencies ?? {}) || '@letsrunit/cli' in (pkg.dependencies ?? {});
}

export function installCli(env: Pick<Environment, 'packageManager' | 'cwd'>): void {
  execPm(env, {
    npm: 'install --save-dev @letsrunit/cli',
    yarn: 'add --dev @letsrunit/cli',
    pnpm: 'add -D @letsrunit/cli',
    bun: 'add -d @letsrunit/cli',
  });
}
