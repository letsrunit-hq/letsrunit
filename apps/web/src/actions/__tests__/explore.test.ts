import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { startExploreRun } from '../explore';

// Mock the executor's explore to synchronously invoke the callback then resolve
vi.mock('@letsrunit/executor', () => {
  return {
    explore: async (_target: string, _opts: any, onInfo: (info: any, actions: any[]) => Promise<any>) => {
      const info = {
        url: 'https://site.test',
        title: 'Site',
        description: 'Desc',
        image: 'https://img',
        logo: 'https://logo',
        author: 'Auth',
        publisher: 'Pub',
        lang: 'en',
        favicon: 'https://icon',
        purpose: 'Automate',
        loginAvailable: true,
      };
      const actions = [
        { name: 'Do A', description: 'First', done: false },
        { name: 'Do B', description: 'Second', done: true },
      ];
      await onInfo(info, actions);
      return { status: 'ok' };
    },
  };
});

class FakeTableQuery {
  public ops: any[];
  private table: string;

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

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
}

describe('explore lib', () => {
  it('runs explore for new project: creates project, inserts run and suggestions, updates run status', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;

    const runId = await startExploreRun('https://site.test', { supabase });

    // Run is inserted immediately
    const runInsert = (supabase as any).ops.find((o: any) => o.type === 'insert' && o.table === 'runs');
    expect(runInsert).toBeTruthy();
    expect(runInsert.payload.status).toBe('running');
    expect(runInsert.payload.type).toBe('explore');
    expect(runInsert.payload.target).toBe('https://site.test');
    expect(runInsert.payload.id).toBe(runId);

    // Project is created
    const projectInsert = (supabase as any).ops.find((o: any) => o.type === 'insert' && o.table === 'projects');
    expect(projectInsert).toBeTruthy();
    const projectId = projectInsert.payload.id;

    // Allow async .then() chain to complete
    await flush();

    // Suggestions inserted
    const suggestionsInsert = (supabase as any).ops.find((o: any) => o.type === 'insert' && o.table === 'suggestions');
    expect(suggestionsInsert).toBeTruthy();
    const suggestions = suggestionsInsert.payload;
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions).toHaveLength(2);
    // check linkage
    expect(suggestions.every((s: any) => s.projectId === projectId && s.runId === runId)).toBe(true);

    // Project updated with info
    const projectUpdate = (supabase as any).ops.find((o: any) => o.type === 'update' && o.table === 'projects');
    expect(projectUpdate).toBeTruthy();

    // Run finished status updated
    const runUpdate = (supabase as any).ops.find((o: any) => o.type === 'update' && o.table === 'runs');
    expect(runUpdate).toBeTruthy();
    expect(runUpdate.values.status).toBe('ok');
    expect(runUpdate.values.finished_at).toBeTypeOf('string');
  });

  it('uses existing projectId and does not update project info', async () => {
    const supabase = new FakeSupabase() as unknown as SupabaseClient;

    const projectId = '22222222-2222-2222-2222-222222222222';

    const runId = await startExploreRun('https://site.test', { supabase, projectId: projectId as any });

    // No project update should occur
    const projectUpdate = (supabase as any).ops.find((o: any) => o.type === 'update' && o.table === 'projects');
    expect(projectUpdate).toBeFalsy();

    // Suggestions should still be inserted with given projectId
    await flush();
    const suggestionsInsert = (supabase as any).ops.find((o: any) => o.type === 'insert' && o.table === 'suggestions');
    expect(suggestionsInsert).toBeTruthy();
    const suggestions = suggestionsInsert.payload;
    expect(suggestions.every((s: any) => s.projectId === projectId && s.runId === runId)).toBe(true);
  });
});
