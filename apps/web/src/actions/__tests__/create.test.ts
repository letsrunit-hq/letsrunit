import { describe, expect, it, vi } from 'vitest';
import { disableFeature, enableFeature } from '../features';

vi.mock('@letsrunit/model', () => {
  return {
    updateFeature: vi.fn(),
  };
});

vi.mock('@/libs/auth', () => {
  return {
    getUser: vi.fn().mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111' }),
  };
});

vi.mock('@/libs/supabase/server', () => {
  return {
    connect: vi.fn().mockResolvedValue({}),
  };
});

describe('action features', () => {
  it('enables a feature', async () => {
    const { updateFeature } = await import('@letsrunit/model');

    const featureId = '22222222-2222-2222-2222-222222222222' as any;

    await enableFeature(featureId);

    expect(updateFeature).toHaveBeenCalledWith(
      featureId,
      { enabled: true },
      { by: { id: '11111111-1111-1111-1111-111111111111' } },
    );
  });

  it('disables a feature', async () => {
    const { updateFeature } = await import('@letsrunit/model');

    const featureId = '33333333-3333-3333-3333-333333333333' as any;

    await disableFeature(featureId);

    expect(updateFeature).toHaveBeenCalledWith(
      featureId,
      { enabled: false },
      { by: { id: '11111111-1111-1111-1111-111111111111' } },
    );
  });
});
