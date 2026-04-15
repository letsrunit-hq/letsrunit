import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Environment, execPm } from '../detect.js';

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
  execPm(env, {
    npm: 'install --save-dev @letsrunit/mcp-server',
    yarn: 'add --dev @letsrunit/mcp-server',
    pnpm: 'add -D @letsrunit/mcp-server',
    bun: 'add -d @letsrunit/mcp-server',
  });
}
