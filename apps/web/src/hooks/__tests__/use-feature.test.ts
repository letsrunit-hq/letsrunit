import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFeature } from '../use-feature';
import { fixedUUID } from '@letsrunit/utils';
import type { Feature } from '@letsrunit/model';

const PROJECT_ID = fixedUUID(1, 'project');
const FEATURE_ID = fixedUUID(1, 'feature');

type Handler = (payload: any) => void;
let featureHandler: Handler | undefined;

function featureRow(f: Feature) {
  return {
    id: f.id,
    project_id: f.projectId,
    path: f.path,
    name: f.name,
    description: f.description,
    comments: f.comments,
    body: f.body,
    enabled: f.enabled,
    created_at: f.createdAt.toISOString(),
    created_by: f.createdBy,
    updated_at: f.updatedAt.toISOString(),
    updated_by: f.updatedBy,
    last_run: null,
  } as any;
}

function createFakeClient(row: any) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: row, error: null }),
        }),
      }),
    }),
    channel: () => {
      const ch = {
        on: (_event: string, filter: any, handler: Handler) => {
          if (filter?.table === 'features') featureHandler = handler;
          return ch as any;
        },
        subscribe: () => ({ id: 'ch' }),
      } as any;
      return ch;
    },
    removeChannel: () => {},
  } as any;
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
    const client = createFakeClient(featureRow(f));

    const { result } = renderHook(() => useFeature(FEATURE_ID as any, { client }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.feature?.id).toBe(FEATURE_ID);
    });

    const updated = makeFeature({ name: 'Feature A (updated)' });

    act(() => {
      featureHandler?.({ new: featureRow(updated) });
    });

    await waitFor(() => {
      expect(result.current.feature?.name).toBe('Feature A (updated)');
    });
  });
});
