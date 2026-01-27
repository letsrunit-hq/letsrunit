import { randomUUID } from '@letsrunit/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { createRun, updateRunStatus } from '../src';

class FakeTableQuery {
  public ops: any[];
  private readonly table: string;

  constructor(table: string, ops: any[]) {
    this.table = table;
    this.ops = ops;
  }
  async insert(payload: any) {
    this.ops.push({ type: 'insert', table: this.table, payload });
    return { status: 201, error: null } as any;
  }
  update(values: any) {
    const updateOp: any = { type: 'update', table: this.table, values, filters: [] };
    this.ops.push(updateOp);

    const query = {
      eq(column: string, value: any) {
        updateOp.where = { ...updateOp.where, [column]: value };
        return query;
      },
      in(column: string, values: any[]) {
        updateOp.filters.push({ type: 'in', column, values });
        return query;
      },
      neq(column: string, value: any) {
        updateOp.filters.push({ type: 'neq', column, value });
        return query;
      },
      select(_?: string) {
        return query;
      },
      async then(resolve: any) {
        resolve({ status: 200, error: null, data: { id: 'fake_id' } });
      },
      single() {
        return query;
      },
    };
    return query as any;
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
    const res1 = await updateRunStatus(id, 'running', { supabase });
    expect(res1).toBe(true);
    const first = (supabase as any).ops.find((o: any) => o.type === 'update' && o.table === 'runs');
    expect(first.values.status).toBe('running');
    expect('finished_at' in first.values).toBe(false);
    expect(first.where.id).toBe(id);

    // terminal
    (supabase as any).ops.length = 0;
    const res2 = await updateRunStatus(id, 'passed', { supabase });
    expect(res2).toBe(true);
    const second = (supabase as any).ops.find((o: any) => o.type === 'update' && o.table === 'runs');
    expect(second.values.status).toBe('passed');
    expect(second.values.finished_at).toBeTypeOf('string');
  });

  it('updateRunStatus only allows updates from queued/running and prevents running -> queued', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;
    const id = randomUUID();

    // Test transition to running
    await updateRunStatus(id, 'running', { supabase });
    const op1 = (supabase as any).ops.at(-1);
    expect(op1.values.status).toBe('running');
    expect(op1.filters).toContainEqual({ type: 'in', column: 'status', values: ['queued', 'running'] });
    expect(op1.filters).toContainEqual({ type: 'neq', column: 'status', value: 'running' });

    // Test transition to queued (should only be allowed if current is queued, but wait, issue says "only update if status is queued or running" AND "not allowed to go from running back to queued")
    // If we want to go TO queued, it must NOT be running.
    (supabase as any).ops.length = 0;
    await updateRunStatus(id, 'queued', { supabase });
    const op2 = (supabase as any).ops.at(-1);
    expect(op2.values.status).toBe('queued');
    expect(op2.filters).toContainEqual({ type: 'in', column: 'status', values: ['queued', 'running'] });
    expect(op2.filters).toContainEqual({ type: 'neq', column: 'status', value: 'running' });
    expect(op2.filters).toContainEqual({ type: 'neq', column: 'status', value: 'queued' });

    // Test transition to passed
    (supabase as any).ops.length = 0;
    await updateRunStatus(id, 'passed', { supabase });
    const op3 = (supabase as any).ops.at(-1);
    expect(op3.values.status).toBe('passed');
    expect(op3.filters).toContainEqual({ type: 'in', column: 'status', values: ['queued', 'running'] });
  });
});
