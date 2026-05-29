import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { setupCucumber } from '../src/setup/cucumber';

const dirs: string[] = [];

function makeDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'letsrunit-cucumber-'));
  dirs.push(path);
  return path;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('setupCucumber', () => {
  it('creates cucumber.js that reads LETSRUNIT_BASE_URL from .letsrunit/.env', () => {
    const cwd = makeDir();

    const result = setupCucumber({ cwd, packageManager: 'npm' }, { baseUrl: 'http://localhost:4100' });

    expect(result.configResult).toBe('created');
    const config = readFileSync(join(cwd, 'cucumber.js'), 'utf-8');
    expect(config).toContain('loadLetsrunitEnv();');
    expect(config).toContain("baseURL: process.env.LETSRUNIT_BASE_URL ?? 'http://localhost:4100'");
  });

  it('does not patch an existing cucumber.js', () => {
    const cwd = makeDir();
    const current = "export default { worldParameters: { baseURL: 'http://localhost:3000' } };\n";
    writeFileSync(join(cwd, 'cucumber.js'), current, 'utf-8');

    setupCucumber({ cwd, packageManager: 'npm' }, { baseUrl: 'http://localhost:4100' });

    expect(readFileSync(join(cwd, 'cucumber.js'), 'utf-8')).toBe(current);
  });
});
