import { getJournal, getRun } from '@letsrunit/model';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRun } from '../use-run';

// Mock @letsrunit/model
vi.mock('@letsrunit/model', async () => {
  const actual = await vi.importActual('@letsrunit/model');
  return {
    ...actual,
    getRun: vi.fn(),
    getJournal: vi.fn(),
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

// By default, ensure the real connect() is not accidentally called
vi.mock('@/libs/supabase/browser', () => ({
  connect: vi.fn(() => {
    throw new Error('Default supabase connect() should not be called in this test');
  }),
}));

describe('useRun', () => {
  const run = { id: 'run-1', status: 'queued' };
  const journal = { runId: 'run-1', entries: [] };

  it('fetches run and journal on mount and clears loading', async () => {
    const mockClient = createMockClient();
    vi.mocked(getRun).mockResolvedValue(run as any);
    vi.mocked(getJournal).mockResolvedValue(journal as any);

    const { result } = renderHook(() => useRun('run-1', { client: mockClient }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.run).toEqual(run);
    expect(result.current.journal).toEqual(journal);
  });

  it('listens to runs realtime and updates run', async () => {
    const mockClient = createMockClient();
    vi.mocked(getRun).mockResolvedValue(run as any);
    vi.mocked(getJournal).mockResolvedValue(journal as any);

    const { result } = renderHook(() => useRun('run-1', { client: mockClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      mockClient.__trigger('runs', { new: { id: 'run-1', status: 'completed' } });
    });

    await waitFor(() => {
      expect(result.current.run?.status).toBe('completed');
    });
  });

  it('listens to journal_entries realtime and refetches journal', async () => {
    const mockClient = createMockClient();
    vi.mocked(getRun).mockResolvedValue(run as any);
    vi.mocked(getJournal).mockResolvedValue(journal);

    const { result } = renderHook(() => useRun('run-1', { client: mockClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedJournal = { runId: 'run-1', entries: [{ id: 'e1', message: 'test' }] };
    vi.mocked(getJournal).mockResolvedValue(updatedJournal as any);

    act(() => {
      mockClient.__trigger('journal_entries');
    });

    await waitFor(() => {
      expect(getJournal).toHaveBeenCalled();
      expect(result.current.journal).toEqual(updatedJournal);
    });
  });

  it('cleans up the realtime channel on unmount', async () => {
    const mockClient = createMockClient();
    vi.mocked(getRun).mockResolvedValue(run as any);
    vi.mocked(getJournal).mockResolvedValue(journal as any);

    const { unmount, result } = renderHook(() => useRun('run-1', { client: mockClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();
    expect(mockClient.removeChannel).toHaveBeenCalled();
  });
});
