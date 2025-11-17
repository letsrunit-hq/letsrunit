import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useRun } from './use-run';

type JournalEntryData = {
  id: string;
  run_id: string;
  type: string;
  message: string;
  created_at: string;
  artifacts?: any[];
};

function createMockClient({ run, journal }: { run: any; journal: JournalEntryData[] }) {
  // Mutable state backing the mock
  const state = {
    run,
    journal,
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
      order: vi.fn(() => api),
      single: vi.fn(async () => ({ data: state.run, error: null })),
    };

    if (table === 'journal_entries') {
      api.single = undefined; // not used for journal
      api.then = undefined;
      api.exec = undefined;
      api.order = vi.fn(async () => ({ data: state.journal, error: null }));
      api.eq = vi.fn(() => api);
      api.select = vi.fn(() => api);
      // For chaining: select().eq().order() returns the promise result directly
      api.order = vi.fn((_field: string, _opts: any) => ({
        then: (res: any) => res({ data: state.journal, error: null }),
      }));
      // But our hook awaits the result, not uses then chaining implicitly; emulate await by returning a promise
      api.order = vi.fn((_field: string, _opts: any) => Promise.resolve({ data: state.journal, error: null }));
    }

    if (table === 'runs') {
      // select().eq().single()
      api.select = vi.fn(() => api);
      api.eq = vi.fn(() => api);
      api.single = vi.fn(async () => ({ data: state.run, error: null }));
    }

    return api;
  });

  const removeChannel = vi.fn();

  const client: Partial<SupabaseClient> & {
    __trigger: (table: string, payload?: any) => void;
    __setJournal: (j: JournalEntryData[]) => void;
    __setRun: (r: any) => void;
  } = {
    from,
    channel: vi.fn(() => channel) as any,
    removeChannel: removeChannel as any,
    __trigger: (table: string, payload?: any) => {
      (handlers[table] ?? []).forEach((h) => h(payload));
    },
    __setJournal: (j: JournalEntryData[]) => {
      state.journal = j;
    },
    __setRun: (r: any) => {
      state.run = r;
    },
  } as any;

  return client;
}

// By default, ensure the real supabase() is not accidentally called
vi.mock('@/libs/supabase', () => ({
  supabase: vi.fn(() => {
    throw new Error('Default supabase() should not be called in this test');
  }),
}));

describe('useRun', () => {
  const run = { id: 'run-1', status: 'queued' };
  const baseJournal: JournalEntryData[] = [
    { id: 'e1', run_id: 'run-1', type: 'title', message: 'Start', created_at: '2024-01-01T00:00:00Z' },
    { id: 'e2', run_id: 'run-1', type: 'prepare', message: 'Step A', created_at: '2024-01-01T00:00:01Z' },
  ];

  it('fetches run and journal on mount and clears loading', async () => {
    const mock = createMockClient({ run, journal: baseJournal });

    const { result } = renderHook(() => useRun('run-1', { client: mock as unknown as SupabaseClient }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.run).toBeTruthy();
    expect(result.current.journal?.runId).toBe('run-1');
    expect(result.current.journal?.entries.length).toBeGreaterThan(0);
  });

  it('listens to journal_entries realtime and refetches journal', async () => {
    const mock = createMockClient({ run, journal: baseJournal });

    const { result } = renderHook(() => useRun('run-1', { client: mock as unknown as SupabaseClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Update mock data and trigger the event
    const updated = [
      ...baseJournal,
      { id: 'e3', run_id: 'run-1', type: 'success', message: 'Step A', created_at: '2024-01-01T00:00:02Z' },
    ];
    mock.__setJournal(updated);

    act(() => {
      mock.__trigger('journal_entries');
    });

    await waitFor(() => {
      expect(result.current.journal?.entries.length).toBe(2); // prepare collapsed into success
    });
  });

  it('cleans up the realtime channel on unmount', async () => {
    const mock = createMockClient({ run, journal: baseJournal });
    const { unmount, result } = renderHook(() => useRun('run-1', { client: mock as unknown as SupabaseClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();
    expect((mock as any).removeChannel).toHaveBeenCalledTimes(1);
  });

  it('uses injected client and does not call default supabase()', async () => {
    const mock = createMockClient({ run, journal: baseJournal });
    const { result } = renderHook(() => useRun('run-1', { client: mock as unknown as SupabaseClient }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
