import type { Locator, Page } from '@playwright/test';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@letsrunit/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@letsrunit/utils')>();
  return { ...actual, sleep: vi.fn().mockResolvedValue(undefined) };
});

import * as waitModule from '../src/wait';

const { waitForIdle, waitForMeta, waitForDomIdle, waitForAnimationsToFinish, waitForUrlChange, waitUntilEnabled, waitAfterInteraction } = waitModule;

type PageLike = Pick<Page, 'waitForLoadState' | 'waitForFunction' | 'getByRole'>;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('waitForIdle', () => {
  it('waits for DOM content loaded and network idle states with the provided timeout', async () => {
    const waitForLoadState = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);

    const page = { waitForLoadState } as unknown as Page;

    await waitForIdle(page, 321);

    expect(waitForLoadState).toHaveBeenCalledTimes(2);
    expect(waitForLoadState).toHaveBeenNthCalledWith(1, 'domcontentloaded');
    expect(waitForLoadState).toHaveBeenNthCalledWith(2, 'networkidle', { timeout: 321 });
  });

  it('swallows network idle wait errors', async () => {
    const waitForLoadState = vi
      .fn()
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
    const getByRole = vi.fn().mockReturnValue({});

    const page = { waitForLoadState, waitForFunction, getByRole } as PageLike as Page;

    vi.spyOn(waitModule, 'waitForIdle').mockResolvedValueOnce(undefined);

    await waitForMeta(page, 789);

    expect(getByRole).toHaveBeenCalledWith('navigation');
    expect(waitForFunction).toHaveBeenCalledTimes(1);
    const [callback, options] = waitForFunction.mock.calls[0];
    expect(typeof callback).toBe('function');
    expect(options).toEqual({ timeout: 789 });
  });

  it('swallows waitForFunction errors', async () => {
    const waitForLoadState = vi.fn().mockResolvedValue(undefined);
    const waitForFunction = vi.fn().mockRejectedValue(new Error('meta timeout'));
    const getByRole = vi.fn().mockReturnValue({});

    const page = { waitForLoadState, waitForFunction, getByRole } as PageLike as Page;

    vi.spyOn(waitModule, 'waitForIdle').mockResolvedValueOnce(undefined);

    await expect(waitForMeta(page, 456)).resolves.toBeUndefined();

    expect(getByRole).toHaveBeenCalledWith('navigation');
    expect(waitForFunction).toHaveBeenCalledTimes(1);
  });
});

describe('waitForDomIdle', () => {
  it('calls page.waitForFunction with quiet as arg and timeout in options', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = { waitForFunction } as unknown as Page;

    await waitForDomIdle(page, { quiet: 300, timeout: 5000 });

    expect(waitForFunction).toHaveBeenCalledOnce();
    const [fn, arg, opts] = waitForFunction.mock.calls[0];
    expect(typeof fn).toBe('function');
    expect(arg).toBe(300);
    expect(opts).toEqual({ timeout: 5000 });
  });

  it('uses default quiet=500 and timeout=10000 when no options given', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = { waitForFunction } as unknown as Page;

    await waitForDomIdle(page);

    const [, arg, opts] = waitForFunction.mock.calls[0];
    expect(arg).toBe(500);
    expect(opts).toEqual({ timeout: 10_000 });
  });
});

describe('waitForAnimationsToFinish', () => {
  it('calls page.waitForFunction with element handle, then locator.evaluate', async () => {
    const elementHandle = {};
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const evaluate = vi.fn().mockImplementation(async (fn: () => Promise<void>) => {
      const originalRaf = globalThis.requestAnimationFrame;
      (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      };
      try {
        await fn();
      } finally {
        if (originalRaf) {
          globalThis.requestAnimationFrame = originalRaf;
        } else {
          delete (globalThis as any).requestAnimationFrame;
        }
      }
    });
    const page = { waitForFunction } as unknown as Page;
    const root = {
      elementHandle: vi.fn().mockResolvedValue(elementHandle),
      page: vi.fn().mockReturnValue(page),
      evaluate,
    } as unknown as Locator;

    await waitForAnimationsToFinish(root);

    expect(waitForFunction).toHaveBeenCalledOnce();
    const [fn, arg] = waitForFunction.mock.calls[0];
    expect(typeof fn).toBe('function');
    expect(arg).toBe(elementHandle);

    expect(evaluate).toHaveBeenCalledOnce();
  });
});

describe('waitForUrlChange', () => {
  it('returns true when page.waitForFunction resolves (URL changed)', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = { waitForFunction } as unknown as Page;

    const result = await waitForUrlChange(page, 'http://example.com/before', 3000);

    expect(result).toBe(true);
    expect(waitForFunction).toHaveBeenCalledWith(expect.any(Function), 'http://example.com/before', { timeout: 3000 });
  });

  it('returns false when page.waitForFunction rejects (timeout)', async () => {
    const waitForFunction = vi.fn().mockRejectedValue(new Error('Timeout'));
    const page = { waitForFunction } as unknown as Page;

    const result = await waitForUrlChange(page, 'http://example.com/before', 1000);

    expect(result).toBe(false);
  });
});

describe('waitUntilEnabled', () => {
  it('skips waitForFunction when elementHandle rejects (catch returns null)', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = { waitForFunction } as unknown as Page;
    const target = {
      waitFor: vi.fn().mockResolvedValue(undefined),
      elementHandle: vi.fn().mockRejectedValue(new Error('not found')),
    } as unknown as Locator;

    await waitUntilEnabled(page, target, 2000);

    expect(waitForFunction).not.toHaveBeenCalled();
  });

  it('calls page.waitForFunction when handle is available', async () => {
    const handle = {};
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = { waitForFunction } as unknown as Page;
    const target = {
      waitFor: vi.fn().mockResolvedValue(undefined),
      elementHandle: vi.fn().mockResolvedValue(handle),
    } as unknown as Locator;

    await waitUntilEnabled(page, target, 2000);

    expect(waitForFunction).toHaveBeenCalledWith(expect.any(Function), handle, { timeout: 2000 });
  });

  it('returns early without calling page.waitForFunction when handle is null', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = { waitForFunction } as unknown as Page;
    const target = {
      waitFor: vi.fn().mockResolvedValue(undefined),
      elementHandle: vi.fn().mockResolvedValue(null),
    } as unknown as Locator;

    await waitUntilEnabled(page, target, 2000);

    expect(waitForFunction).not.toHaveBeenCalled();
  });
});

describe('waitAfterInteraction', () => {
  it('calls waitForUrlChange when target has role=link', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const waitForLoadState = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
      waitForLoadState,
    } as unknown as Page;
    const target = {
      getAttribute: vi.fn().mockResolvedValue('link'),
    } as unknown as Locator;

    await waitAfterInteraction(page, target, { navTimeout: 500, settleTimeout: 500, quietMs: 50 });

    // waitForUrlChange calls page.waitForFunction
    expect(waitForFunction).toHaveBeenCalled();
  });

  it('does not call waitForFunction for "other" element kind', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
    } as unknown as Page;
    const target = {
      getAttribute: vi.fn().mockResolvedValue(null),
      evaluate: vi.fn().mockResolvedValue('div'),
    } as unknown as Locator;

    await waitAfterInteraction(page, target);

    expect(waitForFunction).not.toHaveBeenCalled();
  });

  it('identifies an <a> tag as a link via tag name', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const waitForLoadState = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
      waitForLoadState,
    } as unknown as Page;
    const target = {
      getAttribute: vi.fn().mockResolvedValue(null), // no role attr
      evaluate: vi.fn().mockResolvedValue('a'),       // tag is <a>
    } as unknown as Locator;

    await waitAfterInteraction(page, target, { navTimeout: 500, settleTimeout: 500, quietMs: 50 });

    // waitForUrlChange was attempted → waitForFunction called
    expect(waitForFunction).toHaveBeenCalled();
  });

  it('falls back to waitForDomIdle when link target URL did not change', async () => {
    // waitForUrlChange returns false when page.waitForFunction rejects
    const waitForFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error('url timeout')) // waitForUrlChange → false
      .mockResolvedValue(undefined);                   // waitForDomIdle calls
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    const target = {
      getAttribute: vi.fn().mockResolvedValue('link'),
    } as unknown as Locator;

    await waitAfterInteraction(page, target, { navTimeout: 500, settleTimeout: 500, quietMs: 50 });

    // waitForDomIdle should have been called (second waitForFunction call)
    expect(waitForFunction).toHaveBeenCalledTimes(2);
  });

  it('enters the disabled-button path and polls until settled', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const waitForLoadState = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
      waitForLoadState,
    } as unknown as Page;

    // kind='button' via role attribute; target is disabled
    const target = {
      getAttribute: vi.fn((attr: string) => {
        if (attr === 'role') return Promise.resolve('button');
        return Promise.resolve(null);
      }),
      isDisabled: vi.fn().mockResolvedValue(true),
      waitFor: vi.fn().mockResolvedValue(undefined),
      elementHandle: vi.fn().mockResolvedValue(null), // null → waitUntilEnabled returns early
    } as unknown as Locator;

    await waitAfterInteraction(page, target, { settleTimeout: 200, quietMs: 50 });

    // sleep(1000) should have been called (from @letsrunit/utils mock)
    const { sleep } = await import('@letsrunit/utils');
    expect(sleep).toHaveBeenCalledWith(1000);
  });

  it('identifies a <button> tag as a button via evaluate', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
    } as unknown as Page;

    // No role attribute; tag=button (via evaluate) → kind='button'; isDisabled=false → falls through
    const target = {
      getAttribute: vi.fn().mockResolvedValue(null),
      evaluate: vi.fn().mockResolvedValue('button'),
      isDisabled: vi.fn().mockResolvedValue(false),
    } as unknown as Locator;

    await waitAfterInteraction(page, target);

    expect(target.isDisabled).toHaveBeenCalled();
    expect(waitForFunction).not.toHaveBeenCalled();
  });

  it('identifies input[type=button] as a button', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
    } as unknown as Page;

    const getAttribute = vi.fn((attr: string) => {
      if (attr === 'role') return Promise.resolve(null);
      if (attr === 'type') return Promise.resolve('button');
      return Promise.resolve(null);
    });
    const target = {
      getAttribute,
      evaluate: vi.fn().mockResolvedValue('input'),
      isDisabled: vi.fn().mockResolvedValue(false),
    } as unknown as Locator;

    await waitAfterInteraction(page, target);

    expect(target.isDisabled).toHaveBeenCalled();
    expect(waitForFunction).not.toHaveBeenCalled();
  });

  it('returns "other" when getAttribute("role") throws and evaluate throws', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
    } as unknown as Page;
    const target = {
      getAttribute: vi.fn().mockRejectedValue(new Error('role timeout')),
      evaluate: vi.fn().mockRejectedValue(new Error('evaluate timeout')),
    } as unknown as Locator;

    await waitAfterInteraction(page, target);

    expect(waitForFunction).not.toHaveBeenCalled();
  });

  it('treats input as "other" when getAttribute("type") throws (catch path)', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
    } as unknown as Page;

    const getAttribute = vi.fn((attr: string) => {
      if (attr === 'role') return Promise.resolve(null);
      if (attr === 'type') return Promise.reject(new Error('timeout'));
      return Promise.resolve(null);
    });
    const target = {
      getAttribute,
      evaluate: vi.fn().mockResolvedValue('input'),
    } as unknown as Locator;

    await waitAfterInteraction(page, target);

    // type could not be read → treated as 'other' → no waitForFunction
    expect(waitForFunction).not.toHaveBeenCalled();
  });

  it('identifies input[type=submit] as a button', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
    } as unknown as Page;

    // No role; tag=input; type=submit → kind='button'; isDisabled=false → falls through
    const getAttribute = vi.fn((attr: string) => {
      if (attr === 'role') return Promise.resolve(null);
      if (attr === 'type') return Promise.resolve('submit');
      return Promise.resolve(null);
    });
    const target = {
      getAttribute,
      evaluate: vi.fn().mockResolvedValue('input'),
      isDisabled: vi.fn().mockResolvedValue(false),
    } as unknown as Locator;

    // Should complete without error; no URL change path taken
    await waitAfterInteraction(page, target);

    // isDisabled was checked because kind='button'
    expect(target.isDisabled).toHaveBeenCalled();
    expect(waitForFunction).not.toHaveBeenCalled();
  });

  it('falls back to "other" when elementKind throws synchronously', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
    } as unknown as Page;
    const target = {
      getAttribute: vi.fn(() => {
        throw new Error('sync failure');
      }),
    } as unknown as Locator;

    await waitAfterInteraction(page, target);

    expect(waitForFunction).not.toHaveBeenCalled();
  });

  it('does not enter disabled-button branch when isDisabled check rejects', async () => {
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue('http://example.com'),
      waitForFunction,
    } as unknown as Page;
    const target = {
      getAttribute: vi.fn().mockResolvedValue('button'),
      isDisabled: vi.fn().mockRejectedValue(new Error('probe timeout')),
      waitFor: vi.fn().mockResolvedValue(undefined),
      elementHandle: vi.fn().mockResolvedValue({}),
    } as unknown as Locator;

    await waitAfterInteraction(page, target);

    expect(target.isDisabled).toHaveBeenCalledWith({ timeout: 1_000 });
    expect(waitForFunction).not.toHaveBeenCalled();
  });
});
