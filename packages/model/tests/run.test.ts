import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createRun, updateRunStatus } from '../src';
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
  update(values: any) {
    const self = this;
    return {
      async eq(column: string, value: any) {
        self.ops.push({ type: 'update', table: self.table, values, where: { [column]: value } });
        return {} as any;
      },
    } as any;
  }
}

class FakeSupabase implements Partial<SupabaseClient> {
  public ops: any[] = [];
  from(table: string) {
    return new FakeTableQuery(table, this.ops) as any;
  }
}

describe('run lib', () => {
  it('createRun inserts snake_case and returns a UUID', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;
    const runId = await createRun(
      { projectId: randomUUID(), type: 'explore', status: 'queued', target: 'https://example.com' },
      { supabase },
    );

    const insert = (supabase as any).ops.find((o: any) => o.type === 'insert' && o.table === 'runs');
    expect(insert).toBeTruthy();
    const payload = insert.payload;

    expect(payload.id).toBeTypeOf('string');
    expect(payload.project_id).toBeTypeOf('string');
    expect(payload.type).toBe('explore');
    expect(payload.status).toBe('queued');
    expect(payload.target).toBe('https://example.com');

    // should not leak camelCase
    expect('projectId' in payload).toBe(false);

    expect(runId).toMatch(/[0-9a-fA-F-]{36}/);
  });

  it('updateRunStatus sets finished_at only for terminal states', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;
    const id = randomUUID();

    // non-terminal
    await updateRunStatus(id, 'running', { supabase });
    const first = (supabase as any).ops.find((o: any) => o.type === 'update' && o.table === 'runs');
    expect(first.values.status).toBe('running');
    expect('finished_at' in first.values).toBe(false);
    expect(first.where.id).toBe(id);

    // terminal
    (supabase as any).ops.length = 0;
    await updateRunStatus(id, 'success', { supabase });
    const second = (supabase as any).ops.find((o: any) => o.type === 'update' && o.table === 'runs');
    expect(second.values.status).toBe('success');
    expect(second.values.finished_at).toBeTypeOf('string');
  });
});
