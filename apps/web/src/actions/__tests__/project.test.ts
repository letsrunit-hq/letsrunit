import { describe, it, expect, vi } from 'vitest';
import { createProject, updateProject } from '../project';
import type { SupabaseClient } from '@supabase/supabase-js';

class FakeTableQuery {
  private table: string;
  public ops: any[];
  constructor(table: string, ops: any[]) {
    this.table = table;
    this.ops = ops;
  }
  async insert(payload: any) {
    this.ops.push({ type: 'insert', table: this.table, payload });
    return {} as any;
  }
  update(values: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
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

describe('project lib', () => {
  it('createProject inserts snake_case keys and skips undefined', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;

    const id = await createProject(
      {
        url: 'https://example.com',
        title: 'Example',
        description: undefined,
        loginAvailable: true,
        purpose: 'demo',
      },
      { supabase },
    );

    // find insert into projects
    const insert = (supabase as any).ops.find((o: any) => o.type === 'insert' && o.table === 'projects');
    expect(insert).toBeTruthy();
    const payload = insert.payload;

    // id should be set
    expect(payload.id).toBeTypeOf('string');

    // snake_case mapping
    expect(payload.url).toBe('https://example.com');
    expect(payload.title).toBe('Example');
    expect(payload.login_available).toBe(true);
    expect(payload.purpose).toBe('demo');

    // skipped undefined field
    expect('description' in payload).toBe(false);

    // timestamps
    expect(payload.created_at).toBeTypeOf('string');
    expect(payload.updated_at).toBeTypeOf('string');

    // should not leak camelCase loginAvailable
    expect('loginAvailable' in payload).toBe(false);

    // returns a UUID
    expect(id).toMatch(/[0-9a-fA-F-]{36}/);
  });

  it('updateProject updates only provided fields in snake_case', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;

    await updateProject('11111111-1111-1111-1111-111111111111', { image: 'https://img', loginAvailable: false }, { supabase });

    const op = (supabase as any).ops.find((o: any) => o.type === 'update' && o.table === 'projects');
    expect(op).toBeTruthy();

    // values should include snake_case and updated_at
    expect(op.values.image).toBe('https://img');
    expect(op.values.login_available).toBe(false);
    expect(op.values.updated_at).toBeTypeOf('string');

    // eq condition
    expect(op.where.id).toBe('11111111-1111-1111-1111-111111111111');

    // no camelCase
    expect('loginAvailable' in op.values).toBe(false);
  });
});
