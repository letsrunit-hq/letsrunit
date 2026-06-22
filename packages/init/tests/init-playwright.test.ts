import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupPlaywright } from '../src/init/playwright.js';
import type { InitContext } from '../src/init/context.js';
import { confirm, log } from '@clack/prompts';

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => {
    throw new Error('confirm should not be called');
  }),
  isCancel: vi.fn(() => false),
  log: {
    success: vi.fn(),
  },
  note: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

const dirs: string[] = [];

function makeDir(): string {
  const path = join(tmpdir(), `letsrunit-init-playwright-${randomUUID()}`);
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

function writeInstalledPlaywright(cwd: string): void {
  const chromiumPath = join(cwd, 'chromium');
  writeFileSync(chromiumPath, '', 'utf-8');
  writeFileSync(
    join(cwd, 'package.json'),
    JSON.stringify({ devDependencies: { '@playwright/test': '1.61.0' } }),
    'utf-8',
  );
  mkdirSync(join(cwd, 'node_modules', 'playwright-core'), { recursive: true });
  writeFileSync(join(cwd, 'node_modules', 'playwright-core', 'package.json'), '{"main":"index.js"}', 'utf-8');
  writeFileSync(
    join(cwd, 'node_modules', 'playwright-core', 'index.js'),
    `exports.chromium = { executablePath: () => ${JSON.stringify(chromiumPath)} };`,
    'utf-8',
  );
}

afterEach(() => {
  vi.clearAllMocks();
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('setupPlaywright', () => {
  it('does not prompt when Playwright and Chromium are already installed', async () => {
    const cwd = makeDir();
    writeInstalledPlaywright(cwd);

    await setupPlaywright(context(cwd));

    expect(confirm).not.toHaveBeenCalled();
    expect(log.success).toHaveBeenCalledWith('Playwright runtime already installed');
  });
});
