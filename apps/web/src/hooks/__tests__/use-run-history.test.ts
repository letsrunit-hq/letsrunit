import type { Run } from '@letsrunit/model';
import { getFeatureName, listRuns } from '@letsrunit/model';
import { fixedUUID } from '@letsrunit/utils';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRunHistory } from '../use-run-history';

// Mock @letsrunit/model
vi.mock('@letsrunit/model', async () => {
  const actual = await vi.importActual('@letsrunit/model');
  return {
    ...actual,
    listRuns: vi.fn(),
    getFeatureName: vi.fn(),
    fromData: vi.fn(() => (data: any) => data),
    toFilter: vi.fn(() => 'filter'),
  };
});

const PROJECT_ID = fixedUUID(1, 'project');
const FEATURE_ID = fixedUUID(1, 'feature');
const R1 = fixedUUID(1);
const R2 = fixedUUID(2);
const R3 = fixedUUID(3);
const R0 = fixedUUID(0);

function createMockClient() {
  const handlers: { [key: string]: ((payload?: any) => void)[] } = {};

  const channel = {
    on: vi.fn((_event: string, cfg: { table: string }, cb: (payload?: any) => void) => {
      const key = cfg.table;
      handlers[key] ??= [];
      handlers[key].push(cb);
      return channel;
    }),
    subscribe: vi.fn(() => ({
      data: { status: 'SUBSCRIBED' },
    })),
  } as any;

  const removeChannel = vi.fn().mockResolvedValue(undefined);

  const client = {
    channel: vi.fn(() => channel),
    removeChannel: removeChannel,
    __trigger: (table: string, payload?: any) => {
      (handlers[table] ?? []).forEach((h) => h(payload));
    },
  } as any;

  return client;
}

function makeRun(overrides: Partial<Run>): Run {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    type: 'test',
    projectId: PROJECT_ID,
    featureId: null,
    target: 'https://example.com',
    status: 'passed',
    error: null,
    startedAt: now,
    finishedAt: now,
    createdAt: now,
    createdBy: null,
    updatedAt: now,
    updatedBy: null,
    ...overrides,
  } as Run;
}

describe('useRunHistory', () => {
  it('loads initial runs ordered by startedAt then createdAt desc', async () => {
    const r1 = makeRun({
      id: R1,
      startedAt: new Date('2025-01-01T10:00:00Z'),
      createdAt: new Date('2025-01-01T10:00:00Z'),
    });
    const r2 = makeRun({
      id: R2,
      startedAt: new Date('2025-01-02T10:00:00Z'),
      createdAt: new Date('2025-01-02T10:00:00Z'),
    });
    const r3 = makeRun({
      id: R3,
      startedAt: new Date('2025-01-01T10:00:00Z'),
      createdAt: new Date('2025-01-01T11:00:00Z'),
    });

    // Hooks sorts them, so order here doesn't matter too much for listRuns mock if we want to test hook's sorting
    vi.mocked(listRuns).mockResolvedValue([r1, r2, r3]);
    const mockClient = createMockClient();

    const { result } = renderHook(() => useRunHistory({ projectId: PROJECT_ID }, undefined, { client: mockClient }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const ids = result.current.runs.map((r) => r.id);
    // R2 (latest started), R3 (same started as R1 but later created), R1
    expect(ids).toEqual([R2, R3, R1]);
  });

  it('applies featureId filter when provided', async () => {
    vi.mocked(listRuns).mockResolvedValue([]);
    const mockClient = createMockClient();

    renderHook(() =>
      useRunHistory({ projectId: PROJECT_ID, featureId: FEATURE_ID }, undefined, { client: mockClient }),
    );

    await waitFor(() => {
      expect(listRuns).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: PROJECT_ID, featureId: FEATURE_ID }),
        expect.any(Object),
      );
    });
  });

  it('handles realtime insert/update and delete and respects limit', async () => {
    const r1 = makeRun({ id: R1, startedAt: new Date('2025-01-01T10:00:00Z') });
    const r2 = makeRun({ id: R2, startedAt: new Date('2025-01-01T09:00:00Z') });
    const r0 = makeRun({ id: R0, startedAt: new Date('2024-12-31T23:59:59Z') });

    vi.mocked(listRuns).mockResolvedValue([r1, r2, r0]);
    const mockClient = createMockClient();
    const { result } = renderHook(() =>
      useRunHistory({ projectId: PROJECT_ID }, undefined, { client: mockClient, limit: 2 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.runs).toHaveLength(2);
    expect(result.current.runs.map((r) => r.id)).toEqual([R1, R2]);

    // simulate insert newer than r1
    const r3 = makeRun({ id: R3, startedAt: new Date('2025-01-03T00:00:00Z') });
    act(() => {
      mockClient.__trigger('runs', {
        eventType: 'INSERT',
        new: r3,
      });
    });

    await waitFor(() => expect(result.current.runs.map((r) => r.id)).toEqual([R3, R1]));

    // simulate update of r2 to become newer than r1
    const r2Updated = { ...r2, startedAt: new Date('2025-01-02T23:00:00Z') };
    act(() => {
      mockClient.__trigger('runs', {
        eventType: 'UPDATE',
        new: r2Updated,
      });
    });
    await waitFor(() => expect(result.current.runs.map((r) => r.id)).toEqual([R3, R2]));

    // simulate delete of r3
    act(() => {
      mockClient.__trigger('runs', { eventType: 'DELETE', old: { id: R3 } });
    });
    await waitFor(() => expect(result.current.runs.map((r) => r.id)).toEqual([R2]));
  });

  it('enriches runs with featureName when no featureId is specified', async () => {
    const r1 = makeRun({ id: R1, featureId: FEATURE_ID, startedAt: new Date('2025-01-01T10:00:00Z') });
    vi.mocked(listRuns).mockResolvedValue([r1]);
    vi.mocked(getFeatureName).mockResolvedValue('Login flow');

    const mockClient = createMockClient();
    const { result } = renderHook(() => useRunHistory({ projectId: PROJECT_ID }, undefined, { client: mockClient }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Wait for the realtime handler to enrich? Wait, initial load doesn't enrich in the hook,
    // it's only on realtime events according to the code!
    // Let's check the code:
    // async function load() { ... const runs = await listRuns(...) ... setRuns(sortRuns(runs, limit)); }
    // There is no enrichment in load().
    // Enrichment is only in onRunEvent.

    const r4 = makeRun({ id: fixedUUID(4), featureId: FEATURE_ID, startedAt: new Date('2025-01-04T10:00:00Z') });
    act(() => {
      mockClient.__trigger('runs', {
        eventType: 'INSERT',
        new: r4,
      });
    });

    await waitFor(() => {
      const enriched = result.current.runs.find((r) => r.id === r4.id);
      expect(enriched?.name).toBe('Login flow');
    });
  });
});
