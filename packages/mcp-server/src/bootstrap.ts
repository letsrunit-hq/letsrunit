import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

export type McpRuntimeMode = 'project' | 'standalone';

const BOOTSTRAPPED_ENV = 'LETSRUNIT_MCP_BOOTSTRAPPED';
export const RUNTIME_MODE_ENV = 'LETSRUNIT_MCP_RUNTIME_MODE';

export type HandoffDecision = {
  shouldHandoff: boolean;
  runtimeMode: McpRuntimeMode;
};

type PackageJsonLike = {
  bin?: string | Record<string, string>;
};

function resolveProjectRoot(): string {
  return resolve(process.env.LETSRUNIT_PROJECT_CWD ?? process.cwd());
}

function resolveFromProject(moduleId: string, projectRoot: string): string | null {
  try {
    const req = createRequire(resolve(projectRoot, 'package.json'));
    return req.resolve(moduleId);
  } catch {
    return null;
  }
}

function toRealpath(path: string | null): string | null {
  if (!path) return null;
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

function samePackageRoot(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return dirname(a) === dirname(b);
}

function resolveBinPath(packageJsonPath: string): string {
  const text = readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(text) as PackageJsonLike;

  if (typeof pkg.bin === 'string') {
    return resolve(dirname(packageJsonPath), pkg.bin);
  }

  if (pkg.bin && typeof pkg.bin === 'object') {
    const named = pkg.bin['letsrunit-mcp'];
    const first = Object.values(pkg.bin)[0];
    const bin = named ?? first;
    if (typeof bin === 'string') {
      return resolve(dirname(packageJsonPath), bin);
    }
  }

  throw new Error(`Unable to resolve mcp bin from ${packageJsonPath}`);
}

export function decideHandoff(
  currentPackageJsonPath: string | null,
  projectPackageJsonPath: string | null,
  isBootstrapped: boolean,
): HandoffDecision {
  if (!projectPackageJsonPath) {
    return { shouldHandoff: false, runtimeMode: 'standalone' };
  }

  if (samePackageRoot(currentPackageJsonPath, projectPackageJsonPath)) {
    return { shouldHandoff: false, runtimeMode: 'project' };
  }

  if (isBootstrapped) {
    return { shouldHandoff: false, runtimeMode: 'standalone' };
  }

  return { shouldHandoff: true, runtimeMode: 'project' };
}

function runProjectLocalServer(projectPackageJsonPath: string): never {
  const entry = resolveBinPath(projectPackageJsonPath);
  const result = spawnSync(process.execPath, [entry, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      [BOOTSTRAPPED_ENV]: '1',
      [RUNTIME_MODE_ENV]: 'project',
    },
  });

  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

export function bootstrapProjectServer(): McpRuntimeMode {
  const projectRoot = resolveProjectRoot();
  const isBootstrapped = process.env[BOOTSTRAPPED_ENV] === '1';
  const currentReq = createRequire(import.meta.url);

  const currentPackageJsonPath = toRealpath(currentReq.resolve('../package.json'));
  const projectPackageJsonPath = toRealpath(resolveFromProject('@letsrunit/mcp-server/package.json', projectRoot));

  const decision = decideHandoff(currentPackageJsonPath, projectPackageJsonPath, isBootstrapped);

  if (decision.shouldHandoff && projectPackageJsonPath) {
    runProjectLocalServer(projectPackageJsonPath);
  }

  process.env[RUNTIME_MODE_ENV] = decision.runtimeMode;
  return decision.runtimeMode;
}
