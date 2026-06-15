import { beforeEach, describe, expect, it, vi } from 'vitest';

const run = vi.fn();
const exec = vi.fn();
const Database = vi.fn(function MockDatabase() {
  return {
  run,
  exec,
  };
});

vi.mock('node-sqlite3-wasm', () => ({
  default: { Database },
}));

describe('store lock retries', () => {
  beforeEach(() => {
    vi.resetModules();
    Database.mockClear();
    run.mockReset();
    exec.mockReset();
  });

  it('retries openStore setup when SQLite reports a transient lock', async () => {
    const locked = new Error('SQLite3Error: database is locked');
    run.mockImplementationOnce(() => {
      throw locked;
    });

    const { openStore } = await import('../src/db.js');

    expect(() => openStore('/tmp/letsrunit.db')).not.toThrow();
    expect(Database).toHaveBeenCalledWith('/tmp/letsrunit.db');
    expect(run).toHaveBeenCalledWith('PRAGMA busy_timeout = 5000');
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('retries write helpers when SQLite reports a transient lock', async () => {
    const locked = new Error('SQLite3Error: database is locked');
    const db = {
      run: vi
        .fn()
        .mockImplementationOnce(() => {
          throw locked;
        })
        .mockImplementationOnce(() => undefined),
    };

    const { insertRun } = await import('../src/write.js');

    expect(() => insertRun(db as never, '61'.repeat(32), 'abc123', 1000)).not.toThrow();
    expect(db.run).toHaveBeenCalledTimes(2);
  });
});
