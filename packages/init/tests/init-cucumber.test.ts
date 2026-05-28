import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { setupCucumber } from '../src/init/cucumber.js';
import type { InitContext } from '../src/init/context.js';

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
});
