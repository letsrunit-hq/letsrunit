import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Environment, execPm } from '../detect.js';
import { resolveInstallSpec } from './local-package.js';

export function isMcpServerInstalled({ cwd }: Pick<Environment, 'cwd'>): boolean {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return false;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

  return (
    '@letsrunit/mcp-server' in (pkg.devDependencies ?? {}) ||
    '@letsrunit/mcp-server' in (pkg.dependencies ?? {})
  );
}

export function installMcpServer(env: Pick<Environment, 'packageManager' | 'cwd'>): void {
  const spec = resolveInstallSpec(env, '@letsrunit/mcp-server', 'mcp-server.tgz');
  execPm(env, {
    npm: `install --save-dev ${spec}`,
    yarn: `add --dev ${spec}`,
    pnpm: `add -D ${spec}`,
    bun: `add -d ${spec}`,
  });
}
