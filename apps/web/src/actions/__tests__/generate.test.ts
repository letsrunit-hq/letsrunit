import { describe, expect, it, vi } from 'vitest';
import { startGenerateRun } from '../generate';

// Mocks
vi.mock('@letsrunit/model', () => {
  return {
    createRun: vi.fn(),
  };
});

vi.mock('@/libs/auth', () => {
  return {
    getUser: vi.fn().mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111' }),
  };
});

describe('action generate', () => {
  it('creates a generate run with the given featureId and returns runId', async () => {
    const { createRun } = await import('@letsrunit/model');
    const runId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    (createRun as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(runId);

    const featureId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' as any;
    const res = await startGenerateRun(featureId, { supabase: {} as any });

    expect(createRun).toHaveBeenCalledWith(
      { type: 'generate', featureId },
      { by: { id: '11111111-1111-1111-1111-111111111111' } },
    );
    expect(res).toBe(runId);
  });
});
