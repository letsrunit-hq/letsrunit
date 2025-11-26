import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Feature } from '@letsrunit/model';
import { useFeatureList } from '../use-feature-list';
import { fixedUUID } from '@letsrunit/utils';

const PROJECT_ID = fixedUUID(1, 'project');
const FEATURE_ID = fixedUUID(1, 'feature');

// Fake Supabase client (from/select chain + realtime channel)
type Handler = (payload: any) => void;
let runsHandler: Handler | undefined;
let featuresHandler: Handler | undefined;

function makeQueryResponse(rows: any[]) {
  return {
    eq: () => ({
      order: (_field?: any, _opts?: any) => ({
        limit: () => ({ data: rows, status: 200, error: null }),
      }),
    }),
  } as any;
}

const featureRow = (f: Feature) => ({
  id: f.id,
  project_id: f.projectId,
  name: f.name,
  description: f.description,
  comments: f.comments,
  body: f.body,
  enabled: f.enabled,
  created_at: f.createdAt.toISOString(),
  created_by: f.createdBy,
  updated_at: f.updatedAt.toISOString(),
  updated_by: f.updatedBy,
  last_run: [],
});

function createFakeClient(initialRows: any[] = []) {
  let rows = initialRows;
  return {
    from: () => ({
      select: () => makeQueryResponse(rows),
    }),
    _setRows: (next: any[]) => {
      rows = next;
    },
    channel: () => ({
      on: (_event: string, filter: any, handler: Handler) => {
        if (filter?.table === 'runs') {
          runsHandler = handler;
        } else if (filter?.table === 'features') {
          featuresHandler = handler;
        }
        return {
          subscribe: () => ({ id: 'ch' }),
        } as any;
      },
    }),
    removeChannel: () => {},
    _helpers: { featureRow },
  } as any;
}

function makeFeature(partial: Partial<Feature> = {}): Feature {
  const now = new Date();
  return {
    id: FEATURE_ID,
    projectId: PROJECT_ID,
    name: 'A',
    description: null,
    comments: null,
    body: 'Feature: a',
    enabled: true,
    lastRun: null,
    createdAt: now,
    createdBy: null,
    updatedAt: now,
    updatedBy: null,
    ...partial,
  };
}

describe('useFeatureList', () => {
  beforeEach(() => {
    runsHandler = undefined;
    featuresHandler = undefined;
  });

  it('loads features and updates lastRun on run insert', async () => {
    // prepare returned rows for initial load using injected client
    const client = createFakeClient();
    const row = client._helpers.featureRow(makeFeature());
    client._setRows([row]);

    const { result } = renderHook(() => useFeatureList(PROJECT_ID, { client } as any));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.features.length).toBe(1);
    });

    // Simulate a new run insert
    const payload = {
      new: {
        id: fixedUUID(1),
        type: 'test',
        project_id: PROJECT_ID,
        feature_id: FEATURE_ID,
        target: 'https://example.com',
        status: 'passed',
        error: null,
        started_at: null,
        finished_at: null,
        created_at: new Date().toISOString(),
        created_by: null,
        updated_at: new Date().toISOString(),
        updated_by: null,
      },
    };

    act(() => {
      if (runsHandler) runsHandler(payload);
    });

    await waitFor(() => {
      expect(result.current.features[0].lastRun?.status).toBe('passed');
    });
  });

  it('adds a new enabled feature when features change event occurs', async () => {
    const client = createFakeClient();
    const f1 = makeFeature({ id: FEATURE_ID, name: 'A' });
    client._setRows([client._helpers.featureRow(f1)]);

    const { result } = renderHook(() => useFeatureList(PROJECT_ID, { client } as any));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.features.length).toBe(1);
      expect(result.current.features[0].name).toBe('A');
    });

    // Now simulate a features table insert event
    const f2 = makeFeature({ id: fixedUUID(2, 'feature') as any, name: 'B' });

    act(() => {
      if (featuresHandler)
        featuresHandler({
          eventType: 'INSERT',
          new: client._helpers.featureRow(f2),
        });
    });

    await waitFor(() => {
      expect(result.current.features.length).toBe(2);
      const names = result.current.features.map((f) => f.name).sort();
      expect(names).toEqual(['A', 'B']);
    });
  });

  it('keeps a feature when it becomes disabled (hook returns all), enabled flag becomes false after update event', async () => {
    const client = createFakeClient();
    const f1 = makeFeature({ id: FEATURE_ID, name: 'A', enabled: true });
    client._setRows([client._helpers.featureRow(f1)]);

    const { result } = renderHook(() => useFeatureList(PROJECT_ID, { client } as any));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.features.length).toBe(1);
    });

    // Simulate that an update event arrives with enabled=false
    const f1Disabled = { ...f1, enabled: false } as Feature;

    act(() => {
      if (featuresHandler)
        featuresHandler({
          eventType: 'UPDATE',
          new: client._helpers.featureRow(f1Disabled),
        });
    });

    await waitFor(() => {
      expect(result.current.features.length).toBe(1);
      expect(result.current.features[0].enabled).toBe(false);
    });
  });
});
