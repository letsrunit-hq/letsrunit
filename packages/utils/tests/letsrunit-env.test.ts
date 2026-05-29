import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadLetsrunitEnv } from '../src/letsrunit-env';

const dirs: string[] = [];
const originalEnv = { ...process.env };

function makeDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'letsrunit-utils-env-'));
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
  it('loads .letsrunit/.env without overriding existing process env', () => {
    const cwd = makeDir();
    mkdirSync(join(cwd, '.letsrunit'));
    writeFileSync(
      join(cwd, '.letsrunit', '.env'),
      [
        'LETSRUNIT_BASE_URL=http://localhost:4000',
        'LETSRUNIT_MODEL_MEDIUM="custom model"',
        'OPENAI_API_KEY=file-key',
      ].join('\n'),
      'utf-8',
    );
    process.env.OPENAI_API_KEY = 'existing-key';

    loadLetsrunitEnv(cwd);

    expect(process.env.LETSRUNIT_BASE_URL).toBe('http://localhost:4000');
    expect(process.env.LETSRUNIT_MODEL_MEDIUM).toBe('custom model');
    expect(process.env.OPENAI_API_KEY).toBe('existing-key');
  });
});
