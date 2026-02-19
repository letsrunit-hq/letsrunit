import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'yarn' | 'pnpm' | 'bun' | 'npm';

export interface Environment {
  isInteractive: boolean;
  packageManager: PackageManager;
  hasCucumber: boolean;
  cwd: string;
}

export function detectEnvironment(): Environment {
  const cwd = process.cwd();
  const isInteractive = Boolean(process.stdout.isTTY && process.stdin.isTTY);

  let packageManager: PackageManager = 'npm';
  if (existsSync(join(cwd, 'yarn.lock'))) packageManager = 'yarn';
  else if (existsSync(join(cwd, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (existsSync(join(cwd, 'bun.lockb'))) packageManager = 'bun';

  const hasCucumber = existsSync(join(cwd, 'node_modules', '@cucumber', 'cucumber', 'package.json'));

  return { isInteractive, packageManager, hasCucumber, cwd };
}
