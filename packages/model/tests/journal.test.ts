import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getJournal } from '../src';

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
        created_by: null,
        updated_at: createdAt,
        updated_by: null,
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
        created_by: null,
        updated_at: createdAt,
        updated_by: null,
      },
      // Title resets prepare map
      {
        id: '3',
        type: 'name',
        message: 'New section',
        meta: {},
        artifacts: [],
        created_at: createdAt,
        created_by: null,
        updated_at: createdAt,
        updated_by: null,
      },
      // Prepare B then failure B appears but since after name, no replacement occurs
      {
        id: '4',
        type: 'prepare',
        message: 'Step B',
        meta: {},
        artifacts: [{ name: 'screenshot-3.png', url: 'https://ok/c.png' }],
        created_at: createdAt,
        created_by: null,
        updated_at: createdAt,
        updated_by: null,
      },
      {
        id: '5',
        type: 'failure',
        message: 'Step B',
        meta: {},
        artifacts: [{ name: 'not-screenshot.png', url: 'https://no/d.png' }],
        created_at: createdAt,
        created_by: null,
        updated_at: createdAt,
        updated_by: null,
      },
    ]);

    const journal = await getJournal(runId as any, { supabase });

    expect(journal.runId).toBe(runId);
    // Entries should be:
    // 1) success (replacing prepare A) with only screenshot artifacts (url truthy)
    // 2) name
    // 3) failure B appended (prepare B was replaced by failure B)
    expect(journal.entries.length).toBe(3);

    const [e1, e2, e3] = journal.entries;
    expect(e1.type).toBe('success');
    // artifacts may include non-screenshots; ensure screenshot property is set and valid
    expect(e1.screenshot).toBeTruthy();
    expect(e1.screenshot!.name.startsWith('screenshot-')).toBe(true);
    expect(!!e1.screenshot!.url).toBe(true);

    expect(e2.type).toBe('name');

    expect(e3.type).toBe('failure');
  });

  it('handles start overwriting prepare, then success overwriting start; merges meta/artifacts and computes duration', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;
    const runId = randomUUID();

    const t0 = new Date('2025-01-01T00:00:00.000Z').toISOString();
    const t1 = new Date('2025-01-01T00:00:02.000Z').toISOString();
    const t2 = new Date('2025-01-01T00:00:07.000Z').toISOString();

    (supabase as any).setRows([
      // prepare
      {
        id: 'p1',
        type: 'prepare',
        message: 'Do thing',
        meta: { a: 1 },
        artifacts: [
          { name: 'screenshot-1.png', url: 'https://ok/a.png' },
          { name: 'log.txt', url: 'https://no/log.txt' },
        ],
        created_at: t0,
        created_by: null,
        updated_at: t0,
        updated_by: null,
      },
      // start should overwrite prepare (keep mapping for later replacement)
      {
        id: 's1',
        type: 'start',
        message: 'Do thing',
        meta: { b: 2 },
        artifacts: [{ name: 'screenshot-2.png', url: 'https://ok/b.png' }],
        created_at: t1,
        created_by: null,
        updated_at: t1,
        updated_by: null,
      },
      // success should overwrite start and prepare
      {
        id: 's2',
        type: 'success',
        message: 'Do thing',
        meta: { c: 3 },
        artifacts: [
          { name: 'screenshot-3.png', url: 'https://ok/c.png' },
          { name: 'not-screenshot.png', url: 'https://ok/ignore.png' },
        ],
        created_at: t2,
        created_by: null,
        updated_at: t2,
        updated_by: null,
      },
    ]);

    const journal = await getJournal(runId as any, { supabase });

    expect(journal.entries.length).toBe(1);
    const [e] = journal.entries;
    expect(e.type).toBe('success');
    // duration between start and success
    expect(e.duration).toBe(new Date(t2).getTime() - new Date(t1).getTime());
    // merged meta shallow
    expect(e.meta).toMatchObject({ a: 1, b: 2, c: 3 });
    // merged artifacts should include all
    expect((e.artifacts ?? []).some((a) => a.name === 'screenshot-1.png')).toBe(true);
    expect((e.artifacts ?? []).some((a) => a.name === 'screenshot-2.png')).toBe(true);
    expect((e.artifacts ?? []).some((a) => a.name === 'screenshot-3.png')).toBe(true);
    // screenshot selected and has url
    expect(e.screenshot && !!e.screenshot.url).toBe(true);
  });

  it('computes duration when failure overwrites start; no duration if success directly overwrites prepare', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;
    const runId = randomUUID();

    const t0 = new Date('2025-01-01T01:00:00.000Z').toISOString();
    const t1 = new Date('2025-01-01T01:00:03.000Z').toISOString();
    const t2 = new Date('2025-01-01T01:00:08.000Z').toISOString();

    (supabase as any).setRows([
      // Case 1: start then failure
      {
        id: 'x1',
        type: 'start',
        message: 'Case 1',
        meta: {},
        artifacts: [],
        created_at: t0,
        created_by: null,
        updated_at: t0,
        updated_by: null,
      },
      {
        id: 'x2',
        type: 'failure',
        message: 'Case 1',
        meta: {},
        artifacts: [],
        created_at: t1,
        created_by: null,
        updated_at: t1,
        updated_by: null,
      },
      // Separator
      {
        id: 'ttl',
        type: 'name',
        message: 'sep',
        meta: {},
        artifacts: [],
        created_at: t1,
        created_by: null,
        updated_at: t1,
        updated_by: null,
      },
      // Case 2: prepare then success (no start)
      {
        id: 'y1',
        type: 'prepare',
        message: 'Case 2',
        meta: {},
        artifacts: [],
        created_at: t1,
        created_by: null,
        updated_at: t1,
        updated_by: null,
      },
      {
        id: 'y2',
        type: 'success',
        message: 'Case 2',
        meta: {},
        artifacts: [],
        created_at: t2,
        created_by: null,
        updated_at: t2,
        updated_by: null,
      },
    ]);

    const journal = await getJournal(runId as any, { supabase });

    const [first, , third] = journal.entries;
    expect(first.type).toBe('failure');
    expect(first.duration).toBe(new Date(t1).getTime() - new Date(t0).getTime());

    expect(third.type).toBe('success');
    expect(third.duration ?? null).toBeNull();
  });
});
