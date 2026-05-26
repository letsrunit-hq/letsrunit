import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureLetsrunitIgnored, writeLetsrunitEnv } from '../src/setup/cli-ai.js';

const dirs: string[] = [];

function makeDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'letsrunit-cli-ai-'));
  dirs.push(path);
  return path;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('ensureLetsrunitIgnored', () => {
  it('creates gitignore with letsrunit directory ignored', () => {
    const cwd = makeDir();

    expect(ensureLetsrunitIgnored(cwd)).toBe('created');
    expect(readFileSync(join(cwd, '.gitignore'), 'utf-8')).toBe('.letsrunit\n');
  });

  it('updates existing gitignore without duplicating entries', () => {
    const cwd = makeDir();
    writeFileSync(join(cwd, '.gitignore'), 'node_modules\n', 'utf-8');

    expect(ensureLetsrunitIgnored(cwd)).toBe('updated');
    expect(ensureLetsrunitIgnored(cwd)).toBe('skipped');
    expect(readFileSync(join(cwd, '.gitignore'), 'utf-8')).toBe('node_modules\n.letsrunit\n');
  });
});

describe('writeLetsrunitEnv', () => {
  it('creates letsrunit env file with provider and model config', () => {
    const cwd = makeDir();

    expect(
      writeLetsrunitEnv(cwd, {
        LETSRUNIT_AI_PROVIDER: 'openai',
        LETSRUNIT_MODEL_LARGE: 'gpt-5.5',
        LETSRUNIT_MODEL_MEDIUM: 'gpt-5.4-mini',
        LETSRUNIT_MODEL_SMALL: 'gpt-5.4-nano',
        OPENAI_API_KEY: 'sk-demo',
      }),
    ).toBe('created');

    expect(readFileSync(join(cwd, '.letsrunit', '.env'), 'utf-8')).toBe(
      [
        'LETSRUNIT_AI_PROVIDER=openai',
        'LETSRUNIT_MODEL_LARGE=gpt-5.5',
        'LETSRUNIT_MODEL_MEDIUM=gpt-5.4-mini',
        'LETSRUNIT_MODEL_SMALL=gpt-5.4-nano',
        'OPENAI_API_KEY=sk-demo',
        '',
      ].join('\n'),
    );
  });

  it('preserves unknown lines and keeps existing keys when omitted', () => {
    const cwd = makeDir();
    writeLetsrunitEnv(cwd, {
      LETSRUNIT_AI_PROVIDER: 'openai',
      LETSRUNIT_MODEL_LARGE: 'old-large',
      OPENAI_API_KEY: 'sk-existing',
    });

    const path = join(cwd, '.letsrunit', '.env');
    writeFileSync(path, `# custom\nCUSTOM=value\n${readFileSync(path, 'utf-8')}`, 'utf-8');

    expect(
      writeLetsrunitEnv(cwd, {
        LETSRUNIT_AI_PROVIDER: 'anthropic',
        LETSRUNIT_MODEL_LARGE: 'claude-opus-4-6',
      }),
    ).toBe('updated');

    expect(readFileSync(path, 'utf-8')).toContain('# custom\nCUSTOM=value\n');
    expect(readFileSync(path, 'utf-8')).toContain('LETSRUNIT_AI_PROVIDER=anthropic\n');
    expect(readFileSync(path, 'utf-8')).toContain('LETSRUNIT_MODEL_LARGE=claude-opus-4-6\n');
    expect(readFileSync(path, 'utf-8')).toContain('OPENAI_API_KEY=sk-existing\n');
  });
});
