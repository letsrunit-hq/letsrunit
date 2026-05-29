import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirm, log } from '@clack/prompts';
import { setupCucumber } from '../src/init/cucumber.js';
import type { InitContext } from '../src/init/context.js';

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => {
    throw new Error('confirm should not be called');
  }),
  isCancel: vi.fn(() => false),
  log: {
    success: vi.fn(),
    warn: vi.fn(),
  },
  note: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

const dirs: string[] = [];

function makeDir(): string {
  const path = join(tmpdir(), `letsrunit-init-cucumber-${randomUUID()}`);
  mkdirSync(path, { recursive: true });
  dirs.push(path);
  return path;
}

function context(cwd: string): Pick<InitContext, 'env' | 'options' | 'baseUrl'> {
  return {
    env: {
      cwd,
      isInteractive: false,
      packageManager: 'npm',
      nodeVersion: 22,
      hasCucumber: true,
    },
    options: { withGithubActions: true },
    baseUrl: 'http://localhost:4100',
  };
}

function writeInstalledCucumber(cwd: string): void {
  writeFileSync(
    join(cwd, 'package.json'),
    JSON.stringify({
      devDependencies: {
        '@cucumber/cucumber': '12.0.0',
        '@letsrunit/cucumber': '0.0.0',
      },
    }),
    'utf-8',
  );
}

afterEach(() => {
  vi.clearAllMocks();
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('setupCucumber init step', () => {
  it('scaffolds support when Cucumber is already installed and another explicit init option is selected', async () => {
    const cwd = makeDir();
    writeInstalledCucumber(cwd);

    await setupCucumber(context(cwd));

    expect(readFileSync(join(cwd, 'features', 'support', 'world.js'), 'utf-8')).toContain('@letsrunit/cucumber');
    expect(readFileSync(join(cwd, 'cucumber.js'), 'utf-8')).toContain(
      "baseURL: process.env.LETSRUNIT_BASE_URL ?? 'http://localhost:4100'",
    );
  });

  it('does not prompt when Cucumber support is already configured without a cucumber.js file', async () => {
    const cwd = makeDir();
    writeInstalledCucumber(cwd);
    mkdirSync(join(cwd, 'features', 'support'), { recursive: true });
    writeFileSync(join(cwd, 'features', 'support', 'world.js'), "import '@letsrunit/cucumber';\n", 'utf-8');

    await setupCucumber({ ...context(cwd), options: {} });

    expect(confirm).not.toHaveBeenCalled();
    expect(log.success).toHaveBeenCalledWith('Cucumber support already configured');
  });
});
