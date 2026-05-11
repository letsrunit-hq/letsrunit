import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Environment, execPm } from '../detect.js';
import { resolveInstallSpec } from './local-package.js';

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
  const spec = resolveInstallSpec(env, '@letsrunit/cli', 'cli.tgz');
  execPm(env, {
    npm: `install --save-dev ${spec}`,
    yarn: `add --dev ${spec}`,
    pnpm: `--allow-build=re2 add -D ${spec}`,
    bun: `add -d ${spec}`,
  });
}
