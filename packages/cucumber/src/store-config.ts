import { join } from 'node:path';

const DEFAULT_DIR = '.letsrunit';

let configuredDbPath: string | undefined;
let configuredRunId: string | undefined;

export function setConfiguredStoreDirectory(directory?: string): void {
  const root = directory ?? DEFAULT_DIR;
  configuredDbPath = join(root, 'letsrunit.db');
}

export function clearConfiguredStoreDirectory(): void {
  configuredDbPath = undefined;
  configuredRunId = undefined;
}

export function getConfiguredStoreDbPath(): string | undefined {
  return configuredDbPath;
}

export function setConfiguredRunId(runId: string): void {
  configuredRunId = runId;
}

export function getConfiguredRunId(): string | undefined {
  return configuredRunId;
}
