import { describe, expect, it, vi } from 'vitest';
import { performance as perfHooks } from 'node:perf_hooks';
import { memoize } from '../src/memoize';

describe('memoize', () => {
  it('returns cached result for identical arguments and avoids duplicate calls', () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses a custom cacheKey to share cache entries', () => {
    const fn = vi.fn((input: { id: number; value: string }) => `value-${input.id}-${input.value}`);
    const cacheKey = vi.fn((args: any[]) => `id-${args[0]?.id}`);
    const memoized = memoize(fn, { cacheKey });

    expect(memoized({ id: 1, value: 'first' })).toBe('value-1-first');
    expect(memoized({ id: 1, value: 'second' })).toBe('value-1-first');

    expect(cacheKey).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('evicts cache entries when the wrapped promise rejects', async () => {
    const fn = vi
      .fn<[], Promise<string>>()
      .mockRejectedValueOnce(new Error('fail-once'))
      .mockResolvedValue('ok');
    const memoized = memoize(fn);

    await expect(memoized()).rejects.toThrow('fail-once');
    await expect(memoized()).resolves.toBe('ok');

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('expires entries based on ttl when using fake timers', async () => {
    vi.useFakeTimers();
    let now = 1000;
    const perfSpy = vi.spyOn(perfHooks, 'now').mockImplementation(() => now);

    const fn = vi.fn((value: string) => `computed-${value}`);
    const memoized = memoize(fn, { ttl: 50 });

    expect(memoized('a')).toBe('computed-a');
    expect(fn).toHaveBeenCalledTimes(1);

    now += 25;
    expect(memoized('a')).toBe('computed-a');
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);

    now += 60;
    expect(memoized('a')).toBe('computed-a');
    expect(fn).toHaveBeenCalledTimes(2);

    perfSpy.mockRestore();
    vi.useRealTimers();
  });

  it('evicts least recently used entries when max limit is reached', () => {
    const fn = vi.fn((value: number) => value * 2);
    const memoized = memoize(fn, { max: 2 });

    expect(memoized(1)).toBe(2);
    expect(memoized(2)).toBe(4);
    expect(memoized(3)).toBe(6);
    expect(fn).toHaveBeenCalledTimes(3);

    expect(memoized(1)).toBe(2);
    expect(fn).toHaveBeenCalledTimes(4);

    expect(memoized(2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(5);
  });
});
