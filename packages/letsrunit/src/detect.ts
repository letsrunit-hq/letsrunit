import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'yarn' | 'pnpm' | 'bun' | 'npm';

export interface Environment {
  isInteractive: boolean;
  packageManager: PackageManager;
  nodeVersion: number;
  hasCucumber: boolean;
  cwd: string;
}

export interface PackageManagerArgs {
  npm: string;
  yarn: string;
  pnpm: string;
  bun: string;
}

export function detectEnvironment(): Environment {
  const cwd = process.cwd();
  const isInteractive = Boolean(process.stdout.isTTY && process.stdin.isTTY);

  let packageManager: PackageManager = 'npm';
  if (existsSync(join(cwd, 'yarn.lock'))) packageManager = 'yarn';
  else if (existsSync(join(cwd, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (existsSync(join(cwd, 'bun.lockb'))) packageManager = 'bun';

  const nodeVersion = parseInt(process.version.slice(1), 10);
  const hasCucumber = existsSync(join(cwd, 'node_modules', '@cucumber', 'cucumber', 'package.json'));

  return { isInteractive, packageManager, nodeVersion, hasCucumber, cwd };
}

function pmCmd(pm: string, args: PackageManagerArgs): string {
  if (pm === 'yarn') return `yarn ${args.yarn}`;
  if (pm === 'pnpm') return `pnpm ${args.pnpm}`;
  if (pm === 'bun') return `bun ${args.bun}`;
  return `npm ${args.npm}`;
}

export function execPm(env: Pick<Environment, 'packageManager' | 'cwd'>, args: PackageManagerArgs) {
  const cmd = pmCmd(env.packageManager, args);
  return execSync(cmd, { stdio: 'inherit', cwd: env.cwd });
}
