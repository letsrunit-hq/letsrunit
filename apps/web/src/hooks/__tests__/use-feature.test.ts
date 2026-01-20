import type { Feature } from '@letsrunit/model';
import { getFeature } from '@letsrunit/model';
import { fixedUUID } from '@letsrunit/utils';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFeature } from '../use-feature';

// Mock @letsrunit/model
vi.mock('@letsrunit/model', async () => {
  const actual = await vi.importActual('@letsrunit/model');
  return {
    ...actual,
    getFeature: vi.fn(),
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
    path: '/',
    name: 'Feature A',
    description: null,
    comments: null,
    body: 'Feature: A',
    enabled: true,
    lastRun: null,
    createdAt: now,
    createdBy: null,
    updatedAt: now,
    updatedBy: null,
    ...partial,
  };
}

describe('useFeature', () => {
  it('loads by id and updates on realtime change', async () => {
    const f = makeFeature();
    const mockClient = createMockClient();
    vi.mocked(getFeature).mockResolvedValue(f);

    const { result } = renderHook(() => useFeature(FEATURE_ID as any, { client: mockClient }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.feature?.id).toBe(FEATURE_ID);
    });

    const updated = makeFeature({ name: 'Feature A (updated)' });

    act(() => {
      mockClient.__trigger('features', { new: updated });
    });

    await waitFor(() => {
      expect(result.current.feature?.name).toBe('Feature A (updated)');
    });
  });
});
