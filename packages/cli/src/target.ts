import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_TARGET = 'http://localhost:3000';
const CUCUMBER_CONFIG_FILES = [
  'cucumber.js',
  'cucumber.mjs',
  'cucumber.cjs',
  'cucumber.ts',
  'cucumber.mts',
  'cucumber.cts',
];

type CucumberConfig = {
  worldParameters?: unknown;
};

function readTargetFromWorldParameters(worldParameters: unknown): string | undefined {
  if (!worldParameters || typeof worldParameters !== 'object') return undefined;

  const values = worldParameters as Record<string, unknown>;
  const candidate = values.url ?? values.baseURL ?? values.baseUrl ?? values.target;
  if (typeof candidate !== 'string') return undefined;

  const target = candidate.trim();
  return target.length > 0 ? target : undefined;
}

function findCucumberConfig(cwd: string): string | undefined {
  for (const filename of CUCUMBER_CONFIG_FILES) {
    const configPath = resolve(cwd, filename);
    if (existsSync(configPath)) return configPath;
  }

  return undefined;
}

async function readTargetFromCucumberWorldParameters(cwd: string): Promise<string | undefined> {
  const configPath = findCucumberConfig(cwd);
  if (!configPath) return undefined;

  try {
    const module = await import(pathToFileURL(configPath).href);
    const config = (module.default ?? module) as CucumberConfig;
    return readTargetFromWorldParameters(config.worldParameters);
  } catch {
    return undefined;
  }
}

export async function resolveTarget(target?: string): Promise<string> {
  const explicitTarget = target?.trim();
  if (explicitTarget) return explicitTarget;

  return (await readTargetFromCucumberWorldParameters(process.cwd())) ?? DEFAULT_TARGET;
}

