import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { storeSuggestions } from '../src';
import { randomUUID } from 'node:crypto';

class FakeTableQuery {
  public ops: any[];
  private readonly table: string;

  constructor(table: string, ops: any[]) {
    this.table = table;
    this.ops = ops;
  }
  async insert(payload: any) {
    this.ops.push({ type: 'insert', table: this.table, payload });
    return {} as any;
  }
}

class FakeSupabase implements Partial<SupabaseClient> {
  public ops: any[] = [];
  from(table: string) {
    return new FakeTableQuery(table, this.ops) as any;
  }
}

describe('suggestion lib', () => {
  it('storeSuggestions inserts mapped rows with snake_case and foreign keys', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;
    const projectId = randomUUID();
    const runId = randomUUID();

    await storeSuggestions(
      projectId,
      runId,
      [
        { name: 'Do thing', description: 'A longer desc', done: 'It works' },
        { name: 'Another', description: 'More words', done: 'Visible state' },
      ],
      { supabase },
    );

    const insert = (supabase as any).ops.find((o: any) => o.type === 'insert' && o.table === 'suggestions');
    expect(insert).toBeTruthy();

    const rows = insert.payload as any[];
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(2);

    for (const row of rows) {
      expect(row.project_id).toBe(projectId);
      expect(row.run_id).toBe(runId);
      expect(row.name).toBeTypeOf('string');
      expect(row.description).toBeTypeOf('string');
      expect(row.done).toBeTypeOf('string');

      // no camelCase foreign keys
      expect('projectId' in row).toBe(false);
      expect('runId' in row).toBe(false);
    }
  });
});
