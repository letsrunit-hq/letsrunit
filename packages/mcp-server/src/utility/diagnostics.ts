import { loadConfiguration } from '@cucumber/cucumber/api';
import { registry } from '@letsrunit/bdd';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decideHandoff, resolveRuntimeModeOverride } from '../bootstrap';
import {
  expandPathPatterns,
  findCucumberConfig,
  getSupportLoadState,
  loadLetsrunitIgnorePatterns,
  resolveEffectiveCwd,
  resolveSupportEntries,
  type SupportEntry,
} from './support';

declare const __LETSRUNIT_VERSION__: string | undefined;

export type Diagnostics = {
  envProjectCwd: string | null;
  processCwd: string;
  inputCwd: string | null;
  effectiveCwd: string;
  projectRoot: string;
  cucumberConfigPath: string | null;
  supportPatterns: string[];
  ignorePatterns: string[];
  ignoredPaths: string[];
  supportEntries: SupportEntry[];
  loadedProjectRoots: string[];
  loadedSupportEntries: string[];
  mcpServer: {
    version: string;
    executablePath: string | null;
    projectServerUsed: boolean;
    handoffDecision: {
      shouldHandoff: boolean;
      runtimeMode: string;
    };
    serverMcpPath: string | null;
    projectMcpPath: string | null;
  };
  letsrunitEnv: Record<string, string>;
  moduleResolution: {
    serverBddPath: string | null;
    projectBddPath: string | null;
  };
  registry: {
    total: number;
    byType: {
      Given: number;
      When: number;
      Then: number;
    };
    definitions: Array<{
      type: 'Given' | 'When' | 'Then';
      source: string;
      comment?: string;
    }>;
  };
};

function resolveFrom(moduleId: string, fromPath: string): string | null {
  try {
    const req = createRequire(fromPath);
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
    return path;
  }
}

function pickLetsrunitEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env)
      .filter(([key, value]) => key.startsWith('LETSRUNIT_') && typeof value === 'string')
      .map(([key, value]) => [key, value as string]),
  );
}

export async function collectDiagnostics(cwd?: string): Promise<Diagnostics> {
  const effectiveCwd = resolveEffectiveCwd(cwd);
  const projectRoot = resolve(effectiveCwd);
  const cucumberConfigPath = findCucumberConfig(projectRoot);
  const { useConfiguration } = await loadConfiguration({}, { cwd: projectRoot });
  const supportPatterns = [...(useConfiguration.require ?? []), ...(useConfiguration.import ?? [])];
  const ignorePatterns = await loadLetsrunitIgnorePatterns(projectRoot);
  const ignoredPaths = await expandPathPatterns(projectRoot, ignorePatterns);
  const supportEntries = await resolveSupportEntries(projectRoot, supportPatterns);
  const supportLoadState = getSupportLoadState();
  const serverBddPath = toRealpath(resolveFrom('@letsrunit/bdd', import.meta.url));
  const projectBddPath = toRealpath(resolveFrom('@letsrunit/bdd', resolve(projectRoot, 'package.json')));
  const projectMcpEntryPath = resolveFrom('@letsrunit/mcp-server', resolve(projectRoot, 'package.json'));
  const currentEntrypointPath = toRealpath(fileURLToPath(import.meta.url));
  const projectEntrypointPath = toRealpath(projectMcpEntryPath);
  const handoffDecision = decideHandoff(
    currentEntrypointPath,
    projectEntrypointPath,
    resolveRuntimeModeOverride(),
  );
  const serverMcpPath = toRealpath(resolveFrom('@letsrunit/mcp-server', import.meta.url));
  const projectMcpPath = toRealpath(projectMcpEntryPath);
  const executablePath = toRealpath(process.argv[1] ?? null);
  const version = typeof __LETSRUNIT_VERSION__ === 'string' ? __LETSRUNIT_VERSION__ : 'unknown';
  const registryDefinitions = registry.defs.map((def) => ({
    type: def.type,
    source: def.source,
    comment: def.comment,
  }));

  return {
    envProjectCwd: process.env.LETSRUNIT_PROJECT_CWD ?? null,
    processCwd: process.cwd(),
    inputCwd: cwd ?? null,
    effectiveCwd,
    projectRoot,
    cucumberConfigPath,
    supportPatterns,
    ignorePatterns,
    ignoredPaths: [...ignoredPaths].sort(),
    supportEntries,
    loadedProjectRoots: supportLoadState.loadedProjectRoots,
    loadedSupportEntries: supportLoadState.loadedSupportEntries,
    mcpServer: {
      version,
      executablePath,
      projectServerUsed: handoffDecision.runtimeMode === 'project',
      handoffDecision: {
        shouldHandoff: handoffDecision.shouldHandoff,
        runtimeMode: handoffDecision.runtimeMode,
      },
      serverMcpPath,
      projectMcpPath,
    },
    letsrunitEnv: pickLetsrunitEnv(),
    moduleResolution: {
      serverBddPath,
      projectBddPath,
    },
    registry: {
      total: registryDefinitions.length,
      byType: {
        Given: registryDefinitions.filter((d) => d.type === 'Given').length,
        When: registryDefinitions.filter((d) => d.type === 'When').length,
        Then: registryDefinitions.filter((d) => d.type === 'Then').length,
      },
      definitions: registryDefinitions,
    },
  };
}
