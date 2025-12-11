import { fixedUUID } from '@letsrunit/utils';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRunHistory } from '../use-run-history';

type RunRow = Record<string, any>;

const PROJECT_ID = fixedUUID(1, 'project');
const FEATURE_ID = fixedUUID(1, 'feature');
const R1 = fixedUUID(1);
const R2 = fixedUUID(2);
const R3 = fixedUUID(3);
const R0 = fixedUUID(0);

function makeRun(overrides: Partial<RunRow>): RunRow {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type: 'test',
    project_id: PROJECT_ID,
    feature_id: null,
    target: 'https://example.com',
    status: 'passed',
    error: null,
    started_at: now,
    finished_at: now,
    created_at: now,
    created_by: null,
    updated_at: now,
    updated_by: null,
    ...overrides,
  };
}

function createSupabaseMock(runsRows: RunRow[] = [], featuresRows: any[] = []) {
  const filters: {
    table?: string;
    wheres: [string, any][];
    orders: [string, { ascending: boolean }][];
    limit?: number;
  } = {
    table: undefined,
    wheres: [],
    orders: [],
    limit: undefined,
  };

  const channelHandlers: {
    table: string;
    filter: string;
    cb: (payload: any) => void;
  }[] = [];

  function compute() {
    // apply filters
    const table = filters.table;
    let data = (table === 'features' ? featuresRows : runsRows).slice();

    for (const [col, val] of filters.wheres) {
      data = data.filter((r) => r[col] === val);
    }

    // apply ordering (supports started_at then created_at)
    if (filters.orders.length > 0) {
      data.sort((a, b) => {
        for (const [col, { ascending }] of filters.orders) {
          const av = a[col];
          const bv = b[col];
          const at = typeof av === 'string' || av instanceof Date ? new Date(av).getTime() : av;
          const bt = typeof bv === 'string' || bv instanceof Date ? new Date(bv).getTime() : bv;
          if (at === bt) continue;
          const dir = ascending ? 1 : -1;
          return at < bt ? -1 * dir : 1 * dir;
        }
        return 0;
      });
    }

    const n = filters.limit ?? data.length;
    return data.slice(0, n);
  }

  const query: any = {
    select: (_sel: string) => query,
    eq: (col: string, val: any) => {
      filters.wheres.push([col, val]);
      return query;
    },
    order: (col: string, opts: { ascending: boolean }) => {
      filters.orders.push([col, opts]);
      return query;
    },
    limit: (_n: number) => {
      filters.limit = _n;
      return query;
    },
    then: (resolve: any) => resolve({ data: compute(), status: 200, error: null }),
    catch: () => query,
    finally: (cb: any) => {
      cb?.();
      return query;
    },
  };

  return {
    from: (table: string) => {
      filters.table = table;
      return query;
    },
    channel: (_name: string) => {
      const ch: any = {
        on: (_event: string, cfg: any, cb: (payload: any) => void) => {
          channelHandlers.push({ table: cfg.table, filter: cfg.filter, cb });
          return ch;
        },
        subscribe: () => ({}) as any,
      };
      return ch;
    },
    removeChannel: () => {},
    __mock: { filters, channelHandlers },
  } as any;
}

describe('useRunHistory', () => {
  it('loads initial runs ordered by startedAt then createdAt desc', async () => {
    const rows = [
      makeRun({ id: R1, started_at: new Date('2025-01-01T10:00:00Z'), created_at: new Date('2025-01-01T10:00:00Z') }),
      makeRun({ id: R2, started_at: new Date('2025-01-02T10:00:00Z'), created_at: new Date('2025-01-02T10:00:00Z') }),
      // Same started, later created should come first
      makeRun({ id: R3, started_at: new Date('2025-01-01T10:00:00Z'), created_at: new Date('2025-01-01T11:00:00Z') }),
    ];

    const client = createSupabaseMock(rows);

    const { result } = renderHook(() => useRunHistory(PROJECT_ID, undefined, undefined, { client }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const ids = result.current.runs.map((r) => r.id);
    // 2222 (latest started), 3333 (same started as 1111 but later created), 1111
    expect(ids).toEqual([R2, R3, R1]);

    // Query assertions
    expect(client.__mock.filters.table).toBe('runs');
    expect(client.__mock.filters.wheres).toContainEqual(['project_id', PROJECT_ID]);
  });

  it('applies featureId filter when provided', async () => {
    const rows = [makeRun({ id: R1, feature_id: FEATURE_ID })];
    const client = createSupabaseMock(rows);
    const projectId = PROJECT_ID;
    const featureId = FEATURE_ID;

    const { result } = renderHook(() => useRunHistory(projectId, undefined, featureId, { client }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.runs).toHaveLength(1);
    expect(client.__mock.filters.wheres).toContainEqual(['feature_id', featureId]);
  });

  it('applies runType filter when provided', async () => {
    const rows = [
      makeRun({ id: R1, type: 'test', started_at: new Date('2025-01-01T10:00:00Z') }),
      makeRun({ id: R2, type: 'generate', started_at: new Date('2025-01-02T10:00:00Z') }),
      makeRun({ id: R3, type: 'test', started_at: new Date('2025-01-03T10:00:00Z') }),
    ];
    const client = createSupabaseMock(rows);

    const { result } = renderHook(() => useRunHistory(PROJECT_ID, 'test', undefined, { client }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const ids = result.current.runs.map((r) => r.id);
    // Only type === 'test' should be returned, newest first
    expect(ids).toEqual([R3, R1]);
    expect(client.__mock.filters.wheres).toContainEqual(['type', 'test']);
  });

  it('handles realtime insert/update and delete and respects limit', async () => {
    const rows = [
      makeRun({ id: R1, started_at: new Date('2025-01-01T10:00:00Z') }),
      makeRun({ id: R2, started_at: new Date('2025-01-01T09:00:00Z') }),
      makeRun({ id: R0, started_at: new Date('2024-12-31T23:59:59Z') }),
    ];
    const client = createSupabaseMock(rows);
    const { result } = renderHook(() => useRunHistory(PROJECT_ID, undefined, undefined, { client, limit: 2 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.runs).toHaveLength(2);
    expect(result.current.runs.map((r) => r.id)).toEqual([R1, R2]);

    // simulate insert newer than r1
    const handler = client.__mock.channelHandlers.find((h: any) => h.table === 'runs');
    expect(handler).toBeTruthy();

    act(() => {
      handler.cb({
        eventType: 'INSERT',
        new: makeRun({ id: R3, started_at: new Date('2025-01-03T00:00:00Z') }),
      });
    });

    await waitFor(() => expect(result.current.runs.map((r) => r.id)).toEqual([R3, R1]));

    // simulate update of r2 to become newer than r1
    act(() => {
      handler.cb({
        eventType: 'UPDATE',
        new: makeRun({ id: R2, started_at: new Date('2025-01-02T23:00:00Z') }),
      });
    });
    await waitFor(() => expect(result.current.runs.map((r) => r.id)).toEqual([R3, R2]));

    // simulate delete of r3
    act(() => {
      handler.cb({ eventType: 'DELETE', old: { id: R3 } });
    });
    // After deleting the newest (r3), with limit trimming earlier, only r2 should remain visible
    await waitFor(() => expect(result.current.runs.map((r) => r.id)).toEqual([R2]));
  });

  it('enriches runs with featureName when no featureId is specified', async () => {
    const rows = [
      makeRun({ id: R1, feature_id: FEATURE_ID, started_at: new Date('2025-01-01T10:00:00Z') }),
    ];
    const features = [
      { id: FEATURE_ID, name: 'Login flow', project_id: PROJECT_ID },
    ];
    const client = createSupabaseMock(rows, features);

    const { result } = renderHook(() => useRunHistory(PROJECT_ID, undefined, undefined, { client }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect((result.current.runs[0] as any).featureName).toBe('Login flow');
  });
});
