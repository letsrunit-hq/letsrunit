import { describe, expect, it, vi } from 'vitest';
import { startGenerateRun } from '../generate';

vi.mock('@letsrunit/model', () => {
  return {
    createFeature: vi.fn(),
    getFeatureTarget: vi.fn(),
  };
});

vi.mock('@/libs/auth', () => {
  return {
    getUser: vi.fn().mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111' }),
  };
});

vi.mock('@/libs/run', () => {
  return {
    queueRun: vi.fn(),
  };
});

describe('action generate', () => {
  it('creates a generate run for an existing featureId', async () => {
    const { createFeature, getFeatureTarget } = await import('@letsrunit/model');
    const { queueRun } = await import('@/libs/run');
    const runId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const target = 'https://site.test/feature';
    (getFeatureTarget as any).mockResolvedValue(target);
    (queueRun as any).mockResolvedValue(runId);

    const featureId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' as any;
    const res = await startGenerateRun(featureId, { supabase: {} as any });

    expect(createFeature).not.toHaveBeenCalled();
    expect(getFeatureTarget).toHaveBeenCalledWith(featureId);
    expect(queueRun).toHaveBeenCalledWith(
      { type: 'generate', featureId, target },
      { by: { id: '11111111-1111-1111-1111-111111111111' } },
    );
    expect(res).toBe(runId);
  });

  it('creates a generate run for a new feature suggestion', async () => {
    const { createFeature, getFeatureTarget } = await import('@letsrunit/model');
    const { queueRun } = await import('@/libs/run');
    const runId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const featureId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const target = 'https://site.test/new';
    (createFeature as any).mockResolvedValue(featureId);
    (getFeatureTarget as any).mockResolvedValue(target);
    (queueRun as any).mockResolvedValue(runId);

    const suggestion = { projectId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' } as any;
    const res = await startGenerateRun(suggestion, { supabase: {} as any });

    expect(createFeature).toHaveBeenCalledWith(suggestion, { by: { id: '11111111-1111-1111-1111-111111111111' } });
    expect(getFeatureTarget).toHaveBeenCalledWith(featureId);
    expect(queueRun).toHaveBeenCalledWith(
      { type: 'generate', featureId, target },
      { by: { id: '11111111-1111-1111-1111-111111111111' } },
    );
    expect(res).toBe(runId);
  });
});
