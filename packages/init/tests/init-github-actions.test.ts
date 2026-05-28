import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { text } from '@clack/prompts';
import { setupGithubActions } from '../src/init/github-actions.js';
import type { InitContext } from '../src/init/context.js';

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => true),
  isCancel: vi.fn(() => false),
  log: {
    info: vi.fn(),
    success: vi.fn(),
  },
  note: vi.fn(),
  select: vi.fn(async () => 'none'),
  text: vi.fn(async () => undefined),
}));

const dirs: string[] = [];

function makeDir(): string {
  const path = join(tmpdir(), `letsrunit-init-github-actions-${randomUUID()}`);
  mkdirSync(path, { recursive: true });
  dirs.push(path);
  return path;
}

function context(cwd: string): Pick<InitContext, 'env' | 'options' | 'appTarget' | 'baseUrl' | 'mailSetup'> {
  return {
    env: {
      cwd,
      isInteractive: true,
      packageManager: 'npm',
      nodeVersion: 22,
      hasCucumber: false,
    },
    options: { withGithubActions: true },
    appTarget: {
      value: { framework: 'unknown', port: 3000, baseUrl: 'http://localhost:3000' },
      confidence: 'low',
      evidence: ['test'],
    },
    baseUrl: 'http://localhost:3000',
    mailSetup: { config: { service: 'none' }, env: { LETSRUNIT_MAILBOX_SERVICE: 'none' } },
  };
}

function writePackageJson(cwd: string): void {
  writeFileSync(
    join(cwd, 'package.json'),
    JSON.stringify({ scripts: { build: 'vite build', start: 'vite preview --host 0.0.0.0' } }),
    'utf-8',
  );
}

afterEach(() => {
  vi.clearAllMocks();
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('setupGithubActions', () => {
  it('skips migration and seed prompts when database service is none', async () => {
    const cwd = makeDir();
    writePackageJson(cwd);

    await setupGithubActions(context(cwd));

    const textMessages = vi.mocked(text).mock.calls.map(([options]) => options.message);
    expect(textMessages).not.toContain('Migration command (optional)');
    expect(textMessages).not.toContain('Seed command (optional)');

    const workflow = readFileSync(join(cwd, '.github', 'workflows', 'letsrunit.yml'), 'utf-8');
    expect(workflow).not.toContain('Run DB migrations');
    expect(workflow).not.toContain('Seed DB');
  });
});
