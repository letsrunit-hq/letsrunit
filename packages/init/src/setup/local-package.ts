import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Environment } from '../detect.js';

export function resolveInstallSpec(
  env: Pick<Environment, 'cwd'>,
  packageName: string,
  tarballName: string,
): string {
  const tarballPath = join(env.cwd, tarballName);
  if (existsSync(tarballPath)) {
    return `file:./${tarballName}`;
  }

  return packageName;
}
