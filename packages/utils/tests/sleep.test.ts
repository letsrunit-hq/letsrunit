import { describe, expect, it, vi } from 'vitest';

import { sleep } from '../src';

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
});
