import { join } from 'node:path';

const DEFAULT_DIR = '.letsrunit';

let configuredDbPath: string | undefined;

export function setConfiguredStoreDirectory(directory?: string): void {
  const root = directory ?? DEFAULT_DIR;
  configuredDbPath = join(root, 'letsrunit.db');
}

export function clearConfiguredStoreDirectory(): void {
  configuredDbPath = undefined;
}

export function getConfiguredStoreDbPath(): string | undefined {
  return configuredDbPath;
}
