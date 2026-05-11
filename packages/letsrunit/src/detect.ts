import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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
  const packageManager = detectPackageManager(cwd);

  const nodeVersion = parseInt(process.version.slice(1), 10);
  const hasCucumber = existsSync(join(cwd, 'node_modules', '@cucumber', 'cucumber', 'package.json'));

  return { isInteractive, packageManager, nodeVersion, hasCucumber, cwd };
}

export function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';

  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return 'npm';

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { packageManager?: string };
    const [name] = pkg.packageManager?.split('@') ?? [];
    if (name === 'yarn' || name === 'pnpm' || name === 'bun' || name === 'npm') {
      return name;
    }
  } catch {
    return 'npm';
  }

  return 'npm';
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
