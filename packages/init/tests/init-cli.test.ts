import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirm, log } from '@clack/prompts';
import { setupCli } from '../src/init/cli.js';
import type { InitContext } from '../src/init/context.js';

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => {
    throw new Error('confirm should not be called');
  }),
  isCancel: vi.fn(() => false),
  log: {
    info: vi.fn(),
    success: vi.fn(),
  },
  note: vi.fn(),
  password: vi.fn(),
  select: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

const dirs: string[] = [];

function makeDir(): string {
  const path = join(tmpdir(), `letsrunit-init-cli-${randomUUID()}`);
  mkdirSync(path, { recursive: true });
  dirs.push(path);
  return path;
}

function context(cwd: string): Pick<InitContext, 'env' | 'options'> {
  return {
    env: {
      cwd,
      isInteractive: true,
      packageManager: 'npm',
      nodeVersion: 22,
      hasCucumber: false,
    },
    options: {},
  };
}

afterEach(() => {
  vi.clearAllMocks();
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('setupCli', () => {
  it('does not prompt when the letsrunit CLI is already installed', async () => {
    const cwd = makeDir();
    writeFileSync(
      join(cwd, 'package.json'),
      JSON.stringify({ devDependencies: { '@letsrunit/cli': '0.0.0' } }),
      'utf-8',
    );

    await setupCli(context(cwd));

    expect(confirm).not.toHaveBeenCalled();
    expect(log.success).toHaveBeenCalledWith('@letsrunit/cli already installed');
  });
});
