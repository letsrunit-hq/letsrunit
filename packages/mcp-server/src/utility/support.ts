import { loadConfiguration } from '@cucumber/cucumber/api';
import { existsSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type CucumberConfig = {
  require?: unknown;
  import?: unknown;
  letsrunit?: {
    ignore?: unknown;
  };
};

export type SupportEntry = { kind: 'path'; value: string } | { kind: 'module'; value: string };

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

export async function expandPathPatterns(baseDir: string, patterns: string[]): Promise<Set<string>> {
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

export async function resolveSupportEntries(baseDir: string, entries: string[]): Promise<SupportEntry[]> {
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

export function findCucumberConfig(cwd: string): string | null {
  for (const filename of CUCUMBER_CONFIG_FILES) {
    const path = resolve(cwd, filename);
    if (existsSync(path)) return path;
  }

  return null;
}

export async function loadLetsrunitIgnorePatterns(cwd: string): Promise<string[]> {
  const configPath = findCucumberConfig(cwd);
  if (!configPath) return [];

  const configModule = await import(pathToFileURL(configPath).href);
  const config = (configModule.default ?? configModule) as CucumberConfig;

  return toStrings(config.letsrunit?.ignore);
}

export function resolveEffectiveCwd(cwd?: string): string {
  return cwd ?? process.env.LETSRUNIT_PROJECT_CWD ?? process.cwd();
}

export function getSupportLoadState(): { loadedProjectRoots: string[]; loadedSupportEntries: string[] } {
  return {
    loadedProjectRoots: [...loadedProjectRoots].sort(),
    loadedSupportEntries: [...loadedSupportEntries].sort(),
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
