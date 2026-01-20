import type { Feature } from '@letsrunit/model';
import { listFeatures } from '@letsrunit/model';
import { fixedUUID } from '@letsrunit/utils';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFeatureList } from '../use-feature-list';

// Mock @letsrunit/model
vi.mock('@letsrunit/model', async () => {
  const actual = await vi.importActual('@letsrunit/model');
  return {
    ...actual,
    listFeatures: vi.fn(),
    fromData: vi.fn(() => (data: any) => data),
  };
});

const PROJECT_ID = fixedUUID(1, 'project');
const FEATURE_ID = fixedUUID(1, 'feature');

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
  } as Feature;
}

describe('useFeatureList', () => {
  it('loads features and updates lastRun on run insert', async () => {
    const mockClient = createMockClient();
    const feature = makeFeature();
    vi.mocked(listFeatures).mockResolvedValue([feature]);

    const { result } = renderHook(() => useFeatureList(PROJECT_ID, undefined, { client: mockClient }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.features.length).toBe(1);
    });

    // Simulate a new run insert
    const payload = {
      new: {
        id: fixedUUID(1),
        status: 'passed',
        featureId: FEATURE_ID,
        createdAt: new Date(),
      },
    };

    act(() => {
      mockClient.__trigger('runs', payload);
    });

    await waitFor(() => {
      expect(result.current.features[0].lastRun?.status).toBe('passed');
    });
  });

  it('adds a new enabled feature when features change event occurs', async () => {
    const mockClient = createMockClient();
    const f1 = makeFeature({ id: FEATURE_ID, name: 'A' });
    vi.mocked(listFeatures).mockResolvedValue([f1]);

    const { result } = renderHook(() => useFeatureList(PROJECT_ID, undefined, { client: mockClient }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.features.length).toBe(1);
      expect(result.current.features[0].name).toBe('A');
    });

    // Now simulate a features table insert event
    const f2 = makeFeature({ id: fixedUUID(2, 'feature') as any, name: 'B' });

    act(() => {
      mockClient.__trigger('features', {
        eventType: 'INSERT',
        new: f2,
      });
    });

    await waitFor(() => {
      expect(result.current.features.length).toBe(2);
      const names = result.current.features.map((f) => f.name).sort();
      expect(names).toEqual(['A', 'B']);
    });
  });

  it('keeps a feature when it becomes disabled, enabled flag becomes false after update event', async () => {
    const mockClient = createMockClient();
    const f1 = makeFeature({ id: FEATURE_ID, name: 'A', enabled: true });
    vi.mocked(listFeatures).mockResolvedValue([f1]);

    const { result } = renderHook(() => useFeatureList(PROJECT_ID, undefined, { client: mockClient }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.features.length).toBe(1);
    });

    // Simulate that an update event arrives with enabled=false
    const f1Disabled = { ...f1, enabled: false };

    act(() => {
      mockClient.__trigger('features', {
        eventType: 'UPDATE',
        new: f1Disabled,
      });
    });

    await waitFor(() => {
      expect(result.current.features.length).toBe(1);
      expect(result.current.features[0].enabled).toBe(false);
    });
  });
});
