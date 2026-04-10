import { loadConfiguration } from '@cucumber/cucumber/api';
import { registry } from '@letsrunit/bdd';
import { existsSync, realpathSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { decideHandoff } from '../bootstrap';

type CucumberConfig = {
  require?: unknown;
  import?: unknown;
  letsrunit?: {
    ignore?: unknown;
  };
};

type SupportEntry = { kind: 'path'; value: string } | { kind: 'module'; value: string };

const CUCUMBER_CONFIG_FILES = [
  'cucumber.js',
  'cucumber.mjs',
  'cucumber.cjs',
  'cucumber.ts',
  'cucumber.mts',
  'cucumber.cts',
];

const loadedProjectRoots = new Set<string>();
const loadedSupportEntries = new Set<string>();

export type SupportDiagnostics = {
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

function toStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function hasGlobMagic(input: string): boolean {
  return /[*?[\]{}]/.test(input);
}

function isPathLike(input: string): boolean {
  return input.startsWith('.') || input.startsWith('/') || /^[A-Za-z]:[\\/]/.test(input);
}

function toAbsolutePath(baseDir: string, input: string): string {
  return isAbsolute(input) ? resolve(input) : resolve(baseDir, input);
}

function normalizeMatch(baseDir: string, match: string): string {
  return isAbsolute(match) ? resolve(match) : resolve(baseDir, match);
}

async function expandPathPatterns(baseDir: string, patterns: string[]): Promise<Set<string>> {
  const files = new Set<string>();

  for (const pattern of patterns) {
    if (hasGlobMagic(pattern)) {
      for await (const match of glob(pattern, { cwd: baseDir })) {
        files.add(normalizeMatch(baseDir, match));
      }
      continue;
    }

    files.add(toAbsolutePath(baseDir, pattern));
  }

  return files;
}

async function resolveSupportEntries(baseDir: string, entries: string[]): Promise<SupportEntry[]> {
  const resolved: SupportEntry[] = [];

  for (const entry of entries) {
    if (hasGlobMagic(entry)) {
      for await (const match of glob(entry, { cwd: baseDir })) {
        resolved.push({ kind: 'path', value: normalizeMatch(baseDir, match) });
      }
      continue;
    }

    if (!isPathLike(entry)) {
      resolved.push({ kind: 'module', value: entry });
      continue;
    }

    resolved.push({ kind: 'path', value: toAbsolutePath(baseDir, entry) });
  }

  return resolved;
}

function findCucumberConfig(cwd: string): string | null {
  for (const filename of CUCUMBER_CONFIG_FILES) {
    const path = resolve(cwd, filename);
    if (existsSync(path)) return path;
  }

  return null;
}

async function loadLetsrunitIgnorePatterns(cwd: string): Promise<string[]> {
  const configPath = findCucumberConfig(cwd);
  if (!configPath) return [];

  const configModule = await import(pathToFileURL(configPath).href);
  const config = (configModule.default ?? configModule) as CucumberConfig;

  return toStrings(config.letsrunit?.ignore);
}

function resolveEffectiveCwd(cwd?: string): string {
  return cwd ?? process.env.LETSRUNIT_PROJECT_CWD ?? process.cwd();
}

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

export async function collectSupportDiagnostics(cwd?: string): Promise<SupportDiagnostics> {
  const effectiveCwd = resolveEffectiveCwd(cwd);
  const projectRoot = resolve(effectiveCwd);
  const cucumberConfigPath = findCucumberConfig(projectRoot);
  const { useConfiguration } = await loadConfiguration({}, { cwd: projectRoot });
  const supportPatterns = [...toStrings(useConfiguration.require), ...toStrings(useConfiguration.import)];
  const ignorePatterns = await loadLetsrunitIgnorePatterns(projectRoot);
  const ignoredPaths = await expandPathPatterns(projectRoot, ignorePatterns);
  const supportEntries = await resolveSupportEntries(projectRoot, supportPatterns);
  const serverBddPath = toRealpath(resolveFrom('@letsrunit/bdd', import.meta.url));
  const projectBddPath = toRealpath(resolveFrom('@letsrunit/bdd', resolve(projectRoot, 'package.json')));
  const projectMcpEntryPath = resolveFrom('@letsrunit/mcp-server', resolve(projectRoot, 'package.json'));
  const currentReq = createRequire(import.meta.url);
  const currentEntrypointPath = toRealpath(fileURLToPath(import.meta.url));
  const projectEntrypointPath = toRealpath(projectMcpEntryPath);
  const handoffDecision = decideHandoff(
    currentEntrypointPath,
    projectEntrypointPath,
    process.env.LETSRUNIT_MCP_BOOTSTRAPPED === '1',
  );
  const serverMcpPath = toRealpath(resolveFrom('@letsrunit/mcp-server', import.meta.url));
  const projectMcpPath = toRealpath(projectMcpEntryPath);
  const executablePath = toRealpath(process.argv[1] ?? null);
  const { version } = currentReq('../../package.json') as { version: string };
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
    loadedProjectRoots: [...loadedProjectRoots].sort(),
    loadedSupportEntries: [...loadedSupportEntries].sort(),
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

export async function loadSupportFiles(cwd?: string): Promise<void> {
  const projectRoot = resolve(resolveEffectiveCwd(cwd));
  if (loadedProjectRoots.has(projectRoot)) return;

  const { useConfiguration } = await loadConfiguration({}, { cwd: projectRoot });
  const supportPatterns = [...toStrings(useConfiguration.require), ...toStrings(useConfiguration.import)];
  if (supportPatterns.length === 0) {
    loadedProjectRoots.add(projectRoot);
    return;
  }

  const ignorePatterns = await loadLetsrunitIgnorePatterns(projectRoot);
  const ignoredPaths = await expandPathPatterns(projectRoot, ignorePatterns);
  const supportEntries = await resolveSupportEntries(projectRoot, supportPatterns);

  for (const entry of supportEntries) {
    if (entry.kind === 'path' && ignoredPaths.has(entry.value)) {
      continue;
    }

    const key = `${entry.kind}:${entry.value}`;
    if (loadedSupportEntries.has(key)) continue;

    if (entry.kind === 'path') {
      await import(pathToFileURL(entry.value).href);
    } else {
      await import(entry.value);
    }

    loadedSupportEntries.add(key);
  }

  loadedProjectRoots.add(projectRoot);
}
