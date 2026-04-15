import { mkdir, appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { getConfiguredRunId, getConfiguredStoreDbPath } from './store-config';

const DEFAULT_STORE_DIR = '.letsrunit';
const FALLBACK_RUN_ID = 'unknown-run';

type UnexpectedErrorMeta = Record<string, unknown>;

function toErrorText(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function resolveStoreDir(): string {
  const dbPath = getConfiguredStoreDbPath();
  if (!dbPath) return DEFAULT_STORE_DIR;
  return dirname(dbPath);
}

function formatMeta(meta?: UnexpectedErrorMeta): string {
  if (!meta) return '';
  const lines = Object.entries(meta).map(([key, value]) => `${key}: ${String(value)}`);
  return lines.join('\n');
}

export async function logUnexpectedError(source: string, error: unknown, meta?: UnexpectedErrorMeta): Promise<void> {
  try {
    const dir = resolveStoreDir();
    const runId = getConfiguredRunId() ?? FALLBACK_RUN_ID;
    await mkdir(dir, { recursive: true });

    const sections = [
      `[${new Date().toISOString()}]`,
      `source: ${source}`,
      formatMeta(meta),
      'error:',
      toErrorText(error),
      '',
    ].filter((part) => part.length > 0);

    await appendFile(join(dir, `${runId}.errors.log`), `${sections.join('\n')}\n`, 'utf8');
  } catch {}
}
