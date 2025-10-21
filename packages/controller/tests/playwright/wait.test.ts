import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from '@playwright/test';
import * as waitModule from '../src/wait';

const { waitForIdle, waitForMeta } = waitModule;

type PageLike = Pick<Page, 'waitForLoadState' | 'waitForFunction'>;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('waitForIdle', () => {
  it('waits for DOM content loaded and network idle states with the provided timeout', async () => {
    const waitForLoadState = vi
      .fn<Parameters<Page['waitForLoadState']>, ReturnType<Page['waitForLoadState']>>()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const page = { waitForLoadState } as unknown as Page;

    await waitForIdle(page, 321);

    expect(waitForLoadState).toHaveBeenCalledTimes(2);
    expect(waitForLoadState).toHaveBeenNthCalledWith(1, 'domcontentloaded');
    expect(waitForLoadState).toHaveBeenNthCalledWith(2, 'networkidle', { timeout: 321 });
  });

  it('swallows network idle wait errors', async () => {
    const waitForLoadState = vi
      .fn<Parameters<Page['waitForLoadState']>, ReturnType<Page['waitForLoadState']>>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('network idle timed out'));

    const page = { waitForLoadState } as unknown as Page;

    await expect(waitForIdle(page, 123)).resolves.toBeUndefined();

    expect(waitForLoadState).toHaveBeenCalledTimes(2);
  });
});

describe('waitForMeta', () => {
  it('waits for idle state and checks for metadata with the provided timeout', async () => {
    const waitForLoadState = vi.fn().mockResolvedValue(undefined);
    const waitForFunction = vi.fn().mockResolvedValue(undefined);

    const page = { waitForLoadState, waitForFunction } as PageLike as Page;

    const waitForIdleSpy = vi.spyOn(waitModule, 'waitForIdle').mockResolvedValueOnce(undefined);

    await waitForMeta(page, 789);

    expect(waitForIdleSpy).toHaveBeenCalledWith(page);
    expect(waitForFunction).toHaveBeenCalledTimes(1);
    const [callback, options] = waitForFunction.mock.calls[0];
    expect(typeof callback).toBe('function');
    expect(options).toEqual({ timeout: 789 });
  });

  it('swallows waitForFunction errors', async () => {
    const waitForLoadState = vi.fn().mockResolvedValue(undefined);
    const waitForFunction = vi.fn().mockRejectedValue(new Error('meta timeout'));

    const page = { waitForLoadState, waitForFunction } as PageLike as Page;

    const waitForIdleSpy = vi.spyOn(waitModule, 'waitForIdle').mockResolvedValueOnce(undefined);

    await expect(waitForMeta(page, 456)).resolves.toBeUndefined();

    expect(waitForIdleSpy).toHaveBeenCalledWith(page);
    expect(waitForFunction).toHaveBeenCalledTimes(1);
  });
});
