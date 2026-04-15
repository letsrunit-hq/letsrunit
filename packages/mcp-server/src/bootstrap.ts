import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type McpRuntimeMode = 'project' | 'standalone';

export type HandoffDecision = {
  shouldHandoff: boolean;
  runtimeMode: McpRuntimeMode;
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

function sameEntrypoint(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a === b;
}

export function resolveRuntimeModeOverride(): McpRuntimeMode | null {
  const runtimeMode = process.env.LETSRUNIT_MCP_RUNTIME_MODE;
  if (runtimeMode == null || runtimeMode === '') {
    return null;
  }
  if (runtimeMode === 'project' || runtimeMode === 'standalone') {
    return runtimeMode;
  }
  throw new Error(
    `Invalid LETSRUNIT_MCP_RUNTIME_MODE: ${runtimeMode}. Expected "project" or "standalone".`,
  );
}

export function decideHandoff(
  currentEntrypointPath: string | null,
  projectEntrypointPath: string | null,
  runtimeModeOverride: McpRuntimeMode | null,
): HandoffDecision {
  if (runtimeModeOverride) {
    return { shouldHandoff: false, runtimeMode: runtimeModeOverride };
  }

  if (!projectEntrypointPath) {
    return { shouldHandoff: false, runtimeMode: 'standalone' };
  }

  if (sameEntrypoint(currentEntrypointPath, projectEntrypointPath)) {
    return { shouldHandoff: false, runtimeMode: 'project' };
  }

  return { shouldHandoff: true, runtimeMode: 'project' };
}

function runProjectLocalServer(projectEntrypointPath: string): never {
  const result = spawnSync(process.execPath, [projectEntrypointPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      LETSRUNIT_MCP_RUNTIME_MODE: 'project',
    },
  });

  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

export function bootstrapProjectServer(): McpRuntimeMode {
  const projectRoot = resolveProjectRoot();
  const runtimeModeOverride = resolveRuntimeModeOverride();

  const currentEntryPath = toRealpath(fileURLToPath(import.meta.url));
  const projectEntryPath = toRealpath(resolveFromProject('@letsrunit/mcp-server', projectRoot));

  const decision = decideHandoff(currentEntryPath, projectEntryPath, runtimeModeOverride);

  if (decision.shouldHandoff && projectEntryPath) {
    runProjectLocalServer(projectEntryPath);
  }

  return decision.runtimeMode;
}
