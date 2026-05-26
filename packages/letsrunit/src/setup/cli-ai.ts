import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type AiProvider = 'openai' | 'anthropic' | 'google';
export type ModelTier = 'large' | 'medium' | 'small';

export interface ProviderPreset {
  provider: AiProvider;
  label: string;
  keyName: string;
  models: Record<ModelTier, string[]>;
  defaults: Record<ModelTier, string>;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    provider: 'openai',
    label: 'OpenAI',
    keyName: 'OPENAI_API_KEY',
    models: {
      large: ['gpt-5.5', 'gpt-5.5-pro', 'gpt-5.4'],
      medium: ['gpt-5.4-mini', 'gpt-5.4', 'gpt-5-mini'],
      small: ['gpt-5.4-nano', 'gpt-5-nano', 'gpt-5.4-mini'],
    },
    defaults: {
      large: 'gpt-5.5',
      medium: 'gpt-5.4-mini',
      small: 'gpt-5.4-nano',
    },
  },
  {
    provider: 'anthropic',
    label: 'Anthropic Claude',
    keyName: 'ANTHROPIC_API_KEY',
    models: {
      large: ['claude-opus-4-6', 'claude-opus-4-1-20250805', 'claude-opus-4-20250514'],
      medium: ['claude-sonnet-4-6', 'claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219'],
      small: ['claude-haiku-4-5-20251001', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'],
    },
    defaults: {
      large: 'claude-opus-4-6',
      medium: 'claude-sonnet-4-6',
      small: 'claude-haiku-4-5-20251001',
    },
  },
  {
    provider: 'google',
    label: 'Google Gemini',
    keyName: 'GOOGLE_GENERATIVE_AI_API_KEY',
    models: {
      large: ['gemini-3-pro-preview', 'gemini-2.5-pro'],
      medium: ['gemini-3-flash-preview', 'gemini-2.5-flash'],
      small: ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'],
    },
    defaults: {
      large: 'gemini-3-pro-preview',
      medium: 'gemini-3-flash-preview',
      small: 'gemini-2.5-flash-lite',
    },
  },
];

const MANAGED_KEYS = new Set([
  'LETSRUNIT_AI_PROVIDER',
  'LETSRUNIT_MODEL_LARGE',
  'LETSRUNIT_MODEL_MEDIUM',
  'LETSRUNIT_MODEL_SMALL',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
]);

export function providerPreset(provider: AiProvider): ProviderPreset {
  const preset = PROVIDER_PRESETS.find((value) => value.provider === provider);
  if (!preset) throw new Error(`Unknown AI provider: ${provider}`);
  return preset;
}

export function ensureLetsrunitIgnored(cwd: string): 'created' | 'updated' | 'skipped' {
  const path = join(cwd, '.gitignore');
  const entry = '.letsrunit';

  if (!existsSync(path)) {
    writeFileSync(path, `${entry}\n`, 'utf-8');
    return 'created';
  }

  const content = readFileSync(path, 'utf-8');
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(entry) || lines.includes(`${entry}/`)) return 'skipped';

  const separator = content.endsWith('\n') || content.length === 0 ? '' : '\n';
  writeFileSync(path, `${content}${separator}${entry}\n`, 'utf-8');
  return 'updated';
}

function formatEnvValue(value: string): string {
  if (/^[A-Za-z0-9._:/+=@-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

function parseEnvKey(line: string): string | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return undefined;
  const index = trimmed.indexOf('=');
  if (index === -1) return undefined;
  return trimmed.slice(0, index).trim() || undefined;
}

export function writeLetsrunitEnv(
  cwd: string,
  values: Record<string, string | undefined>,
): 'created' | 'updated' | 'skipped' {
  const path = join(cwd, '.letsrunit', '.env');
  const existed = existsSync(path);
  const current = existed ? readFileSync(path, 'utf-8') : '';
  const lines = current ? current.replace(/\r\n/g, '\n').split('\n') : [];
  const pending = new Map(Object.entries(values).filter((entry): entry is [string, string] => entry[1] !== undefined));
  const next: string[] = [];

  for (const line of lines) {
    const key = parseEnvKey(line);
    if (!key || !MANAGED_KEYS.has(key)) {
      next.push(line);
      continue;
    }

    if (!pending.has(key)) {
      next.push(line);
      continue;
    }

    next.push(`${key}=${formatEnvValue(pending.get(key) ?? '')}`);
    pending.delete(key);
  }

  if (next.length > 0 && next.at(-1) !== '') next.push('');
  for (const [key, value] of pending) {
    next.push(`${key}=${formatEnvValue(value)}`);
  }

  const output = `${next.filter((line, index) => line !== '' || index < next.length - 1).join('\n')}\n`;
  if (current === output) return 'skipped';

  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, output, 'utf-8');
  return existed ? 'updated' : 'created';
}
