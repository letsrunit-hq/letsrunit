import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { installGithubAction } from '../src/setup/github-actions.js';

const dirs: string[] = [];

function makeDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'letsrunit-gha-'));
  dirs.push(path);
  return path;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('installGithubAction', () => {
  it('creates workflow once and skips when existing', () => {
    const cwd = makeDir();
    writeFileSync(
      join(cwd, 'package.json'),
      JSON.stringify({ scripts: { start: 'node server.js', build: 'vite build' } }, null, 2),
      'utf-8',
    );
    writeFileSync(join(cwd, 'cucumber.js'), "export default { worldParameters: { baseURL: 'http://localhost:3000' } };", 'utf-8');

    const first = installGithubAction({ cwd, packageManager: 'npm', nodeVersion: 22 });
    const second = installGithubAction({ cwd, packageManager: 'npm', nodeVersion: 22 });

    expect(first.status).toBe('created');
    expect(second.status).toBe('skipped');

    const workflow = readFileSync(join(cwd, '.github', 'workflows', 'letsrunit.yml'), 'utf-8');
    expect(workflow).toContain('run: npm ci');
    expect(workflow).toContain('run: npm run start &');
    expect(workflow).toContain('wait-on http://localhost:5173/');
    expect(workflow).toContain('run: npm run build');
  });

  it('includes TODO comments for low-confidence projects', () => {
    const cwd = makeDir();
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: {} }, null, 2), 'utf-8');

    const result = installGithubAction({ cwd, packageManager: 'npm', nodeVersion: 22 });
    expect(result.status).toBe('created');

    const workflow = readFileSync(join(cwd, '.github', 'workflows', 'letsrunit.yml'), 'utf-8');
    expect(workflow).toContain('TODO: verify start command');
    expect(workflow).toContain('TODO: verify application port and baseURL.');
  });
});
