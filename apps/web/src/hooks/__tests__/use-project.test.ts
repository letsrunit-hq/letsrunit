import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useProject } from '../use-project';

function createMockClient({ project }: { project: any }) {
  // Mutable state backing the mock
  const state = {
    project,
  };

  // Handlers captured via channel.on
  const handlers: { [key: string]: ((payload?: any) => void)[] } = {};

  const channel = {
    on: (_event: string, cfg: { table: string }, cb: (payload?: any) => void) => {
      const key = cfg.table;
      handlers[key] ??= [];
      handlers[key].push(cb);
      return channel;
    },
    subscribe: () => ({
      data: { status: 'SUBSCRIBED' },
    }),
  } as any;

  const from = vi.fn((table: string) => {
    const api: any = {
      select: vi.fn(() => api),
      eq: vi.fn(() => api),
      single: vi.fn(async () => ({ data: state.project, error: null })),
    };

    if (table === 'projects') {
      api.select = vi.fn(() => api);
      api.eq = vi.fn(() => api);
      api.single = vi.fn(async () => ({ data: state.project, error: null }));
    }

    return api;
  });

  const removeChannel = vi.fn();

  const client: Partial<SupabaseClient> & {
    __trigger: (table: string, payload?: any) => void;
    __setProject: (r: any) => void;
  } = {
    from,
    channel: vi.fn(() => channel) as any,
    removeChannel: removeChannel as any,
    __trigger: (table: string, payload?: any) => {
      (handlers[table] ?? []).forEach((h) => h(payload));
    },
    __setProject: (r: any) => {
      state.project = r;
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
  const project = { id: 'proj-1', name: 'My Project' };

  it('fetches project on mount and clears loading', async () => {
    const mock = createMockClient({ project });

    const { result } = renderHook(() => useProject('proj-1', { client: mock as unknown as SupabaseClient }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.project).toBeTruthy();
    expect(result.current.project?.id).toBe('proj-1');
  });

  it('listens to projects realtime and updates project', async () => {
    const mock = createMockClient({ project });

    const { result } = renderHook(() => useProject('proj-1', { client: mock as unknown as SupabaseClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Update mock data and trigger the event
    mock.__setProject({ id: 'proj-1', title: 'Updated' });

    act(() => {
      mock.__trigger('projects');
    });

    await waitFor(() => {
      expect(result.current.project?.title).toBe('Updated');
    });
  });

  it('cleans up the realtime channel on unmount', async () => {
    const mock = createMockClient({ project });
    const { unmount, result } = renderHook(() => useProject('proj-1', { client: mock as unknown as SupabaseClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();
    expect((mock as any).removeChannel).toHaveBeenCalledTimes(1);
  });

  it('uses injected client and does not call default supabase()', async () => {
    const mock = createMockClient({ project });
    const { result } = renderHook(() => useProject('proj-1', { client: mock as unknown as SupabaseClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
