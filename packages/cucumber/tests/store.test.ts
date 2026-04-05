import { openStore } from '@letsrunit/store';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';
import storePlugin from '../src/store';

describe('store plugin git metadata', () => {
  let directory = '';

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'letsrunit-cucumber-store-'));
    vi.mocked(execSync).mockReset();
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('skips git commit capture when not in a git repository', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('not a git repository');
    });

    storePlugin.coordinator({
      on: () => {},
      operation: 'runCucumber',
      options: { directory },
    });

    expect(execSync).toHaveBeenCalledWith('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const db = openStore(join(directory, 'letsrunit.db'));
    const run = db.get('SELECT git_commit FROM runs LIMIT 1') as { git_commit: string | null } | undefined;
    expect(run?.git_commit).toBeNull();
  });

  it('stores the git commit when available', () => {
    vi.mocked(execSync).mockReturnValue('abc123\n' as never);

    storePlugin.coordinator({
      on: () => {},
      operation: 'runCucumber',
      options: { directory },
    });

    const db = openStore(join(directory, 'letsrunit.db'));
    const run = db.get('SELECT git_commit FROM runs LIMIT 1') as { git_commit: string | null } | undefined;
    expect(run?.git_commit).toBe('abc123');
  });
});
