import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectPackageManager } from '../src/detect.js';

const tmpDirs: string[] = [];

afterEach(() => {
  while (tmpDirs.length > 0) {
    const dir = tmpDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'letsrunit-detect-'));
  tmpDirs.push(dir);
  return dir;
}

describe('detectPackageManager', () => {
  it('prefers lockfiles when present', () => {
    const dir = createTempDir();
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ packageManager: 'npm@10.0.0' }));
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '');

    expect(detectPackageManager(dir)).toBe('pnpm');
  });

  it('falls back to packageManager metadata when no lockfile exists', () => {
    const dir = createTempDir();
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ packageManager: 'bun@1.2.15' }));

    expect(detectPackageManager(dir)).toBe('bun');
  });

  it('defaults to npm when packageManager metadata is missing or invalid', () => {
    const dir = createTempDir();
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ packageManager: 'unknown@1.0.0' }));

    expect(detectPackageManager(dir)).toBe('npm');
  });
});
