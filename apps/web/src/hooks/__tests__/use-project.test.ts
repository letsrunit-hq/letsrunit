import { getProject } from '@letsrunit/model';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useProject } from '../use-project';

// Mock @letsrunit/model
vi.mock('@letsrunit/model', async () => {
  const actual = await vi.importActual('@letsrunit/model');
  return {
    ...actual,
    getProject: vi.fn(),
    fromData: vi.fn(() => (data: any) => data),
  };
});

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

// Ensure the real supabase() is not accidentally called
vi.mock('@/libs/supabase/browser', () => ({
  connect: vi.fn(() => {
    throw new Error('Default supabase() should not be called in this test');
  }),
}));

describe('useProject', () => {
  const project = { id: 'proj-1', title: 'My Project' };

  it('fetches project on mount and clears loading', async () => {
    const mockClient = createMockClient();
    vi.mocked(getProject).mockResolvedValue(project as any);

    const { result } = renderHook(() => useProject('proj-1', { client: mockClient }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.project).toEqual(project);
  });

  it('listens to projects realtime and updates project', async () => {
    const mockClient = createMockClient();
    vi.mocked(getProject).mockResolvedValue(project as any);

    const { result } = renderHook(() => useProject('proj-1', { client: mockClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      mockClient.__trigger('projects', { new: { id: 'proj-1', title: 'Updated Project' } });
    });

    await waitFor(() => {
      expect(result.current.project?.name).toBe('Updated Project');
    });
  });

  it('cleans up the realtime channel on unmount', async () => {
    const mockClient = createMockClient();
    vi.mocked(getProject).mockResolvedValue(project as any);

    const { unmount, result } = renderHook(() => useProject('proj-1', { client: mockClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();
    expect(mockClient.removeChannel).toHaveBeenCalled();
  });
});
