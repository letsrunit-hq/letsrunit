import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { createProject, updateProject } from '../src';

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
  public storage: any;
  constructor() {
    const self = this;
    const uploads: any[] = [];
    const buckets: any[] = [];
    this.storage = {
      createBucket: vi.fn(async (bucket: string, opts: any) => {
        buckets.push({ type: 'createBucket', bucket, opts });
        self.ops.push({ type: 'createBucket', bucket, opts });
        return {} as any;
      }),
      from: (bucket: string) => {
        return {
          upload: vi.fn(async (path: string, bytes: Uint8Array, _opts: any) => {
            uploads.push({ bucket, path, size: bytes.length });
            self.ops.push({ type: 'upload', bucket, path, size: bytes.length });
            return {} as any;
          }),
          getPublicUrl: (path: string) => {
            const url = `https://public/${bucket}/${path}`;
            self.ops.push({ type: 'publicUrl', bucket, path, url });
            return { data: { publicUrl: url } } as any;
          },
        } as any;
      },
    } as any;
  }
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

    await updateProject(
      '11111111-1111-1111-1111-111111111111',
      { image: 'https://img', loginAvailable: false },
      { supabase },
    );

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

  it('updateProject uploads screenshot bytes to storage and saves public URL', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;

    const projectId = '11111111-1111-1111-1111-111111111111';
    const file = new File([new Uint8Array([1, 2, 3])], 'screenshot.png', { type: 'image/png' });

    // set env for bucket
    const prev = process.env.ARTIFACT_BUCKET;
    process.env.ARTIFACT_BUCKET = 'artifacts';

    await updateProject(projectId as any, { screenshot: file }, { supabase });

    // storage ops
    const ops = (supabase as any).ops;
    expect(ops.find((o: any) => o.type === 'createBucket' && o.bucket === 'artifacts')).toBeTruthy();
    const upload = ops.find((o: any) => o.type === 'upload');
    expect(upload).toBeTruthy();
    expect(upload.bucket).toBe('artifacts');
    expect(upload.path).toContain(projectId);
    expect(upload.path.endsWith('.png')).toBe(true);

    // db update uses URL string
    const update = ops.find((o: any) => o.type === 'update' && o.table === 'projects');
    expect(update).toBeTruthy();
    expect(typeof update.values.screenshot).toBe('string');
    expect(update.values.screenshot).toMatch(/^https:\/\/public\/artifacts\/.*\.png$/);

    // restore env
    if (prev === undefined) {
      delete process.env.ARTIFACT_BUCKET;
    } else {
      process.env.ARTIFACT_BUCKET = prev;
    }
  });
});
