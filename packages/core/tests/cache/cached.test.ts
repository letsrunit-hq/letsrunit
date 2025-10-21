import { describe, it, expect, vi } from 'vitest';
import { cached } from '#cache';

describe('cached', () => {
  it('returns cached value when available', async () => {
    const get = vi.fn().mockResolvedValue('stored');
    const set = vi.fn();
    const cache = {
      get,
      set,
    } as const as Parameters<typeof cached>[0];

    const value = await cached(cache, 'key', vi.fn());

    expect(value).toBe('stored');
    expect(get).toHaveBeenCalledWith('key');
    expect(set).not.toHaveBeenCalled();
  });

  it('stores computed value when missing', async () => {
    const get = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockResolvedValue(undefined);
    const compute = vi.fn().mockResolvedValue('computed');

    const cache = {
      get,
      set,
    } as const as Parameters<typeof cached>[0];

    const value = await cached(cache, 'new-key', compute);

    expect(value).toBe('computed');
    expect(compute).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith('new-key', 'computed');
  });
});
