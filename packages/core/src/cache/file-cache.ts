import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Cache } from '#types';

function sanitizeKey(key: string): string {
  return key.replace(/[\/|:]/g, '-');
}

export class FileCache<T = any> implements Cache<T> {
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  private filePath(key: string): string {
    const safe = sanitizeKey(key);
    return path.join(this.dir, `${safe}.json`);
  }

  async has(key: string): Promise<boolean> {
    try {
      await fs.access(this.filePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<T | undefined> {
    try {
      const fp = this.filePath(key);
      const data = await fs.readFile(fp, 'utf8');
      return JSON.parse(data) as T;
    } catch (err: any) {
      if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'ENOENT') {
        return undefined;
      }
      throw err;
    }
  }

  async set(key: string, value: T): Promise<void> {
    await this.ensureDir();
    const fp = this.filePath(key);
    const json = JSON.stringify(value, null, 2);
    await fs.writeFile(fp, json, 'utf8');
  }
}
