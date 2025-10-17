import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { FileCache } from '#cache';

async function makeTempDir(prefix: string = 'file-cache') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

function filePath(dir: string, key: string) {
  const safe = key.replace(/[\/|:]/g, '-');
  return path.join(dir, `${safe}.json`);
}

describe('fsCache', () => {
  it('returns undefined and false when key is missing', async () => {
    const dir = await makeTempDir();
    const cache = new FileCache(dir);

    expect(await cache.has('missing')).toBe(false);
    expect(await cache.get('missing')).toBeUndefined();
  });

  it('writes and reads JSON values', async () => {
    const dir = await makeTempDir();
    const cache = new FileCache(dir);

    const key = 'user:123/profile|data/foo';
    const value = { id: 123, name: 'Alice', roles: ['admin'], active: true };

    await cache.set(key, value);

    expect(await cache.has(key)).toBe(true);

    const out = await cache.get(key);
    expect(out).toEqual(value);

    const fp = filePath(dir, key);
    const raw = await fs.readFile(fp, 'utf8');
    // ensure stored as valid JSON string of the object
    expect(JSON.parse(raw)).toEqual(value);
  });

  it('supports primitive JSON values', async () => {
    const dir = await makeTempDir();
    const cache = new FileCache(dir);

    await cache.set('count', 42 as any);
    expect(await cache.get('count')).toBe(42);

    await cache.set('flag', true as any);
    expect(await cache.get('flag')).toBe(true);

    await cache.set('msg', 'hello' as any);
    expect(await cache.get('msg')).toBe('hello');
  });
});
