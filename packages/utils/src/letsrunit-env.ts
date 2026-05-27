import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function loadLetsrunitEnv(cwd = process.cwd()): void {
  const path = join(cwd, '.letsrunit', '.env');
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = stripQuotes(trimmed.slice(index + 1));
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}
