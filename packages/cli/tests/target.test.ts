import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveTarget } from '../src/target';

const initialCwd = process.cwd();
const tempDirs: string[] = [];

afterEach(async () => {
  process.chdir(initialCwd);

  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

async function createTempProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'letsrunit-cli-target-'));
  tempDirs.push(dir);
  return dir;
}

describe('resolveTarget', () => {
  it('uses explicit --target when provided', async () => {
    const target = await resolveTarget('https://explicit.example');
    expect(target).toBe('https://explicit.example');
  });

  it('reads baseURL from cucumber.js worldParameters', async () => {
    const cwd = await createTempProject();
    await writeFile(
      join(cwd, 'cucumber.js'),
      "export default { worldParameters: { baseURL: 'https://from-cucumber.example' } };",
      'utf-8',
    );
    process.chdir(cwd);

    const target = await resolveTarget();
    expect(target).toBe('https://from-cucumber.example');
  });

  it('falls back to localhost when cucumber.js is missing', async () => {
    const cwd = await createTempProject();
    process.chdir(cwd);

    const target = await resolveTarget();
    expect(target).toBe('http://localhost:3000');
  });

  it('falls back to localhost when worldParameters has no URL target', async () => {
    const cwd = await createTempProject();
    await writeFile(join(cwd, 'cucumber.js'), 'export default { worldParameters: { headless: true } };', 'utf-8');
    process.chdir(cwd);

    const target = await resolveTarget();
    expect(target).toBe('http://localhost:3000');
  });
});

