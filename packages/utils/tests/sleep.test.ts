import { describe, expect, it, vi } from 'vitest';

import { eventually, sleep } from '../src';

describe('sleep', () => {
  it('waits for the requested duration before resolving', async () => {
    vi.useFakeTimers();

    const sleepPromise = sleep(500);

    expect(vi.getTimerCount()).toBe(1);

    await vi.advanceTimersByTimeAsync(500);
    await expect(sleepPromise).resolves.toBeUndefined();

    vi.useRealTimers();
  });

  it('passes the delay to setTimeout', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    sleep(1234);

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy.mock.calls[0]?.[1]).toBe(1234);

    setTimeoutSpy.mockRestore();
  });

  it('rejects immediately if signal is already aborted (uses reason when provided)', async () => {
    const ac = new AbortController();
    const reason = new Error('stop-now');
    ac.abort(reason);

    await expect(sleep(1000, { signal: ac.signal })).rejects.toBe(reason);
  });

  it('rejects and clears timer when aborted during sleep', async () => {
    vi.useFakeTimers();

    const ac = new AbortController();
    const reason = new Error('mid-cancel');
    const p = sleep(1000, { signal: ac.signal });

    // one timer scheduled
    expect(vi.getTimerCount()).toBe(1);

    // abort before the timeout fires
    ac.abort(reason);

    await expect(p).rejects.toBe(reason);

    // timer should be cleared by cleanup
    expect(vi.getTimerCount()).toBe(0);

    vi.useRealTimers();
  });
});

describe('eventually', () => {
  it('resolves immediately when fn succeeds first time', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    await expect(eventually(fn, { timeout: 1000, interval: 50 })).resolves.toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until fn succeeds before timeout', async () => {
    vi.useFakeTimers();

    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockResolvedValue(undefined);

    const promise = eventually(fn, { timeout: 5000, interval: 200 });

    // first attempt is immediate
    expect(fn).toHaveBeenCalledTimes(1);

    // advance one interval -> second attempt
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(2);

    // advance next interval -> third attempt succeeds
    await vi.advanceTimersByTimeAsync(200);

    await expect(promise).resolves.toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('throws the last error after timeout is exceeded', async () => {
    vi.useFakeTimers();

    const lastErr = new Error('final');
    // Throw synchronously to avoid PromiseRejectionHandledWarning noise
    const fn = vi.fn(() => {
      throw lastErr;
    });

    const promise = eventually(fn, { timeout: 500, interval: 100 });
    // attach handler early to avoid PromiseRejectionHandledWarning from Node
    const captured = promise.catch(e => e);

    // initial call + retries every 100ms until 500ms passes
    // timeline: t=0 (call1), 100 (2), 200 (3), 300 (4), 400 (5), after 500 stop and throw last
    await vi.advanceTimersByTimeAsync(600);

    await expect(captured).resolves.toBe(lastErr);

    // should have been called 5 times within 0..400ms
    expect(fn).toHaveBeenCalledTimes(5);

    vi.useRealTimers();
  });

  it('aborts retries when signal aborts and rejects with the abort reason', async () => {
    vi.useFakeTimers();

    const ac = new AbortController();
    const reason = new Error('aborted');
    const fn = vi.fn().mockRejectedValue(new Error('keep failing'));

    const promise = eventually(fn, { timeout: 5000, interval: 200, signal: ac.signal });

    // first attempt
    expect(fn).toHaveBeenCalledTimes(1);

    // schedule abort before next retry
    await vi.advanceTimersByTimeAsync(50);
    ac.abort(reason);

    await expect(promise).rejects.toBe(reason);

    // ensure no further retries occurred
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
