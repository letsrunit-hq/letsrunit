import { describe, expect, it } from 'vitest';
import { getJournal } from '../../../../../packages/model/src/journal';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Journal, RawLogEntry } from '@letsrunit/model';

class FakeSelectQuery {
  private rows: any[] | null;
  private err: any;
  constructor(rows: any[] | null, err: any) {
    this.rows = rows;
    this.err = err;
  }
  select(_cols: string) {
    return this;
  }
  eq(_column: string, _value: any) {
    return this;
  }
  order(_column: string, _opts: any) {
    return Promise.resolve({ data: this.rows, error: this.err });
  }
}

class FakeSupabase implements Partial<SupabaseClient> {
  private rows: any[] | null;
  private err: any;
  constructor(rows: any[] | null, err: any) {
    this.rows = rows;
    this.err = err;
  }
  from(_table: string) {
    return new FakeSelectQuery(this.rows, this.err) as any;
  }
}

describe('getJournal action', () => {
  it('returns empty entries on fetch error', async () => {
    const supabase = new FakeSupabase(null, { message: 'boom' }) as unknown as SupabaseClient;

    const data = await getJournal('run-1', { supabase });
    expect(data).toEqual({ entries: [] } satisfies Journal);
  });

  it('merges prepare with success by message and concatenates artifacts, filtering to screenshots', async () => {
    const raw: Partial<RawLogEntry>[] = [
      {
        id: '1',
        run_id: 'r',
        type: 'prepare',
        message: 'Step A',
        meta: null,
        created_at: '2025-01-01T00:00:00.000Z',
        artifacts: [
          { name: 'screenshot-1.png', url: 'https://cdn/1.png' },
          { name: 'notes.txt', url: 'https://cdn/n.txt' },
        ],
      },
      {
        id: '2',
        run_id: 'r',
        type: 'success',
        message: 'Step A',
        meta: null,
        created_at: '2025-01-01T00:00:01.000Z',
        artifacts: [
          { name: 'screenshot-2.png', url: 'https://cdn/2.png' },
          { name: 'image.jpg', url: 'https://cdn/2.jpg' },
        ],
      },
    ];

    const supabase = new FakeSupabase(raw as any, null) as unknown as SupabaseClient;

    const data = await getJournal('run-1', { supabase });
    expect(data.entries).toHaveLength(1);
    const [entry] = data.entries;
    expect(entry.type).toBe('success');
    expect(entry.message).toBe('Step A');

    // Only screenshot-*.png should remain and preserve order: from prepare then success
    expect(entry.artifacts.map((a) => a.name)).toEqual(['screenshot-1.png', 'screenshot-2.png']);
  });

  it('does not merge across titles (title clears pending prepares)', async () => {
    const raw: Partial<RawLogEntry>[] = [
      { id: 'p', run_id: 'r', type: 'prepare', message: 'Do X', meta: null, created_at: 't0', artifacts: [] },
      { id: 't', run_id: 'r', type: 'title', message: 'New Section', meta: null, created_at: 't1', artifacts: [] },
      { id: 's', run_id: 'r', type: 'success', message: 'Do X', meta: null, created_at: 't2', artifacts: [] },
    ];

    const supabase = new FakeSupabase(raw as any, null) as unknown as SupabaseClient;

    const data = await getJournal('run-1', { supabase });
    expect(data.entries.map((e) => e.type)).toEqual(['prepare', 'title', 'success']);
    expect(data.entries[0].message).toBe('Do X');
    expect(data.entries[2].message).toBe('Do X');
  });

  it('keeps non-prepare entries as-is and filters out artifacts without url', async () => {
    const raw: Partial<RawLogEntry>[] = [
      {
        id: 'a',
        run_id: 'r',
        type: 'info',
        message: 'Hello',
        meta: null,
        created_at: 't0',
        artifacts: [{ name: 'screenshot-3.png', url: '' as unknown as string }],
      },
      {
        id: 'b',
        run_id: 'r',
        type: 'warn',
        message: 'Careful',
        meta: null,
        created_at: 't1',
        artifacts: [{ name: 'screenshot-4.png', url: 'http://ok/4.png' }],
      },
    ];

    const supabase = new FakeSupabase(raw as any, null) as unknown as SupabaseClient;

    const data = await getJournal('run-1', { supabase });
    expect(data.entries).toHaveLength(2);
    // First entry artifacts filtered because url is falsy
    expect(data.entries[0].artifacts).toEqual([]);
    // Second entry keeps screenshot-4.png
    expect(data.entries[1].artifacts.map((a) => a.name)).toEqual(['screenshot-4.png']);
  });
});
