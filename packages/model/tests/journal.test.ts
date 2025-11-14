import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getJournal } from '../src';
import { randomUUID } from 'node:crypto';

class FakeTableQuery {
  public ops: any[];
  private readonly table: string;
  private response: any[] = [];

  constructor(table: string, ops: any[]) {
    this.table = table;
    this.ops = ops;
  }
  select() {
    return this;
  }
  eq(column: string, value: any) {
    this.ops.push({ type: 'select', table: this.table, where: { [column]: value } });
    return this;
  }
  order(column: string, _opts: any) {
    this.ops.push({ type: 'order', table: this.table, by: column });
    return {
      then: (resolve: any) => resolve({ data: this.response, error: null }),
    } as any;
  }

  // helper to set mock rows
  setRows(rows: any[]) {
    this.response = rows;
  }
}

class FakeSupabase implements Partial<SupabaseClient> {
  public ops: any[] = [];
  private table?: FakeTableQuery;
  private pendingRows: any[] | null = null;
  from(table: string) {
    if (!this.table) {
      this.table = new FakeTableQuery(table, this.ops);
      if (this.pendingRows) {
        this.table.setRows(this.pendingRows);
        this.pendingRows = null;
      }
    }
    return this.table as any;
  }
  // helper
  setRows(rows: any[]) {
    if (this.table) this.table.setRows(rows);
    else this.pendingRows = rows;
  }
}

describe('journal lib', () => {
  it('getJournal filters artifacts to screenshots and replaces prepare with success/failure of same message', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;
    const runId = randomUUID();

    const createdAt = new Date().toISOString();

    (supabase as any).setRows([
      // Prepare step A
      {
        id: '1',
        type: 'prepare',
        message: 'Step A',
        meta: {},
        artifacts: [
          { name: 'screenshot-1.png', url: 'https://ok/a.png' },
          { name: 'log.txt', url: 'https://no/log.txt' },
        ],
        created_at: createdAt,
      },
      // Success for A, should replace previous prepare
      {
        id: '2',
        type: 'success',
        message: 'Step A',
        meta: {},
        artifacts: [
          { name: 'screenshot-2.png', url: 'https://ok/b.png' },
          { name: 'not-screenshot.png', url: 'https://ok/ignore.png' }, // filtered: not a screenshot
        ],
        created_at: createdAt,
      },
      // Title resets prepare map
      {
        id: '3',
        type: 'title',
        message: 'New section',
        meta: {},
        artifacts: [],
        created_at: createdAt,
      },
      // Prepare B then failure B appears but since after title, no replacement occurs
      {
        id: '4',
        type: 'prepare',
        message: 'Step B',
        meta: {},
        artifacts: [{ name: 'screenshot-3.png', url: 'https://ok/c.png' }],
        created_at: createdAt,
      },
      {
        id: '5',
        type: 'failure',
        message: 'Step B',
        meta: {},
        artifacts: [{ name: 'not-screenshot.png', url: 'https://no/d.png' }],
        created_at: createdAt,
      },
    ]);

    const journal = await getJournal(runId as any, { supabase });

    expect(journal.runId).toBe(runId);
    // Entries should be:
    // 1) success (replacing prepare A) with only screenshot artifacts (url truthy)
    // 2) title
    // 3) failure B appended (prepare B was replaced by failure B)
    expect(journal.entries.length).toBe(3);

    const [e1, e2, e3] = journal.entries;
    expect(e1.type).toBe('success');
    expect(e1.artifacts.every((a) => a.name.startsWith('screenshot-'))).toBe(true);
    expect(e1.artifacts.every((a) => !!a.url)).toBe(true);

    expect(e2.type).toBe('title');

    expect(e3.type).toBe('failure');
  });
});
