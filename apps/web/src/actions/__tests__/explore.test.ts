import { describe, expect, it, vi } from 'vitest';
import { startExploreRun } from '../explore';

vi.mock('@letsrunit/model', () => {
  return {
    createProject: vi.fn(),
    createRun: vi.fn(),
  };
});

vi.mock('@/libs/auth', () => {
  return {
    getUser: vi.fn().mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111' }),
  };
});

describe('action explore', () => {
  it('creates project when not provided and then creates explore run (normalizes target)', async () => {
    const { createProject, createRun } = await import('@letsrunit/model');
    const createdProjectId = '22222222-2222-2222-2222-222222222222';
    const runId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    (createProject as any).mockResolvedValue(createdProjectId);
    (createRun as any).mockResolvedValue(runId);

    const result = await startExploreRun('site.test', { supabase: {} as any });

    expect(createProject).toHaveBeenCalledWith(
      { url: 'https://site.test', accountId: '11111111-1111-1111-1111-111111111111' },
      { by: { id: '11111111-1111-1111-1111-111111111111' } },
    );
    expect(createRun).toHaveBeenCalledWith(
      { type: 'explore', projectId: createdProjectId, target: 'https://site.test' },
      { by: { id: '11111111-1111-1111-1111-111111111111' } },
    );
    expect(result).toBe(runId);
  });

  it('uses provided projectId and does not call createProject', async () => {
    const { createProject, createRun } = await import('@letsrunit/model');
    const runId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    (createRun as any).mockResolvedValue(runId);
    (createProject as any).mockReset();

    const projectId = '33333333-3333-3333-3333-333333333333' as any;
    const result = await startExploreRun('https://site.test', { supabase: {} as any, projectId });

    expect(createProject).not.toHaveBeenCalled();
    expect(createRun).toHaveBeenCalledWith(
      { type: 'explore', projectId, target: 'https://site.test' },
      { by: { id: '11111111-1111-1111-1111-111111111111' } },
    );
    expect(result).toBe(runId);
  });
});
