import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadLetsrunitEnv } from '../src/letsrunit-env';

const dirs: string[] = [];
const originalEnv = { ...process.env };

function makeDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'letsrunit-env-'));
  dirs.push(path);
  return path;
}

afterEach(() => {
  process.env = { ...originalEnv };
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('loadLetsrunitEnv', () => {
  it('loads values from .letsrunit/.env without overriding existing environment', () => {
    const cwd = makeDir();
    mkdirSync(join(cwd, '.letsrunit'));
    writeFileSync(
      join(cwd, '.letsrunit', '.env'),
      [
        'LETSRUNIT_AI_PROVIDER=google',
        'LETSRUNIT_MODEL_MEDIUM="gemini-3-flash-preview"',
        'OPENAI_API_KEY=file-key',
      ].join('\n'),
      'utf-8',
    );
    process.env.OPENAI_API_KEY = 'existing-key';

    loadLetsrunitEnv(cwd);

    expect(process.env.LETSRUNIT_AI_PROVIDER).toBe('google');
    expect(process.env.LETSRUNIT_MODEL_MEDIUM).toBe('gemini-3-flash-preview');
    expect(process.env.OPENAI_API_KEY).toBe('existing-key');
  });
});
