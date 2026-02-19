import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PackageManager } from '../detect.js';

function isCliInstalled(cwd: string): boolean {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return false;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

  return '@letsrunit/cli' in (pkg.devDependencies ?? {}) || '@letsrunit/cli' in (pkg.dependencies ?? {});
}

export interface CliInstallResult {
  installed: boolean;
  skipped: boolean;
}

export function installCli(pm: PackageManager, cwd: string): CliInstallResult {
  if (isCliInstalled(cwd)) {
    return { installed: false, skipped: true };
  }

  const cmd =
    pm === 'yarn'
      ? 'yarn add --dev @letsrunit/cli'
      : pm === 'pnpm'
        ? 'pnpm add -D @letsrunit/cli'
        : pm === 'bun'
          ? 'bun add -d @letsrunit/cli'
          : 'npm install --save-dev @letsrunit/cli';

  execSync(cmd, { stdio: 'inherit', cwd });
  return { installed: true, skipped: false };
}
