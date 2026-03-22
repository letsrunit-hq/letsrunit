import { afterEach, describe, expect, it, vi } from 'vitest';

describe('polling loops', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mailhog wait mode performs a sleep cycle and then exits when signal is aborted', async () => {
    const sleepMock = vi.fn().mockImplementation(async (_ms: number, { signal }: { signal?: AbortSignal } = {}) => {
      if (signal) {
        Object.defineProperty(signal, 'aborted', { value: true, configurable: true });
      }
    });
    vi.doMock('@letsrunit/utils', async () => {
      const actual = await vi.importActual<any>('@letsrunit/utils');
      return { ...actual, sleep: sleepMock };
    });

    const signal: AbortSignal = {
      aborted: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onabort: null,
      reason: undefined,
      dispatchEvent: vi.fn(),
      throwIfAborted: vi.fn(),
    } as any;

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ items: [] }) });
    vi.stubGlobal('fetch', fetchMock as any);

    const { receiveMail } = await import('../src/mailhog/receive');
    const res = await receiveMail('user@example.com', { wait: true, signal });

    expect(res).toEqual([]);
    expect(sleepMock).toHaveBeenCalledTimes(1);
  });

  it('mailpit wait mode performs a sleep cycle and then exits when signal is aborted', async () => {
    const sleepMock = vi.fn().mockImplementation(async (_ms: number, { signal }: { signal?: AbortSignal } = {}) => {
      if (signal) {
        Object.defineProperty(signal, 'aborted', { value: true, configurable: true });
      }
    });
    vi.doMock('@letsrunit/utils', async () => {
      const actual = await vi.importActual<any>('@letsrunit/utils');
      return { ...actual, sleep: sleepMock };
    });

    const signal: AbortSignal = {
      aborted: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onabort: null,
      reason: undefined,
      dispatchEvent: vi.fn(),
      throwIfAborted: vi.fn(),
    } as any;

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ messages: [] }) });
    vi.stubGlobal('fetch', fetchMock as any);

    const { receiveMail } = await import('../src/mailpit/receive');
    const res = await receiveMail('user@mailpit.local', { wait: true, signal });

    expect(res).toEqual([]);
    expect(sleepMock).toHaveBeenCalledTimes(1);
  });
});
