import { describe, it, expect, vi } from 'vitest';
import type { Page } from '@playwright/test';
import { suppressInterferences } from '../../src/playwright/suppress-interferences';

function makeBasePageMock() {
  const on = vi.fn();
  const evaluate = vi.fn();
  const getByRole = vi.fn();
  const locator = vi.fn();

  return {
    on,
    evaluate: evaluate as any,
    getByRole: getByRole as any,
    locator: locator as any,
  } as unknown as Page & {
    __m: {
      on: typeof on,
      evaluate: typeof evaluate,
      getByRole: typeof getByRole,
      locator: typeof locator,
    }
  };
}

function makeLocator(overrides?: Partial<any>) {
  const click = vi.fn().mockResolvedValue(undefined);
  const scrollIntoViewIfNeeded = vi.fn().mockResolvedValue(undefined);
  const count = vi.fn().mockResolvedValue(0);
  const first = vi.fn().mockImplementation(function(this: any) { return this; });
  const getByRole = function(this: any) { return this; } as any;

  const filter = function(this: any) { return this; } as any;

  return {
    click,
    scrollIntoViewIfNeeded,
    count,
    first,
    getByRole,
    filter,
    ...overrides,
  };
}

describe('suppressInterferences', () => {
  it('clicks known CMP accept (OneTrust) and stops quickly', async () => {
    const page = makeBasePageMock();

    // locator mock: return element present for OneTrust accept, absent otherwise
    const accSelector = '#onetrust-accept-btn-handler';
    const locCache: Record<string, any> = {};
    page.locator = vi.fn((sel: string) => {
      if (!locCache[sel]) {
        const present = sel === accSelector;
        locCache[sel] = makeLocator({
          count: vi.fn().mockResolvedValue(present ? 1 : 0),
        });
      }
      return locCache[sel];
    }) as any;

    // getByRole path should not be used here
    page.getByRole = vi.fn(() => makeLocator()) as any;

    // overlay heuristic not triggered
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
      // keep quiet/min defaults – maxActions stops immediately after first action
    });

    const acc = (page.locator as any).mock.calls.find((c: any[]) => c[0] === accSelector);
    expect(acc, 'should query OneTrust accept selector').toBeTruthy();

    const acceptLoc = (page.locator as any).mock.results.find((r: any, i: number) => (page.locator as any).mock.calls[i][0] === accSelector)?.value;
    expect(acceptLoc.click).toHaveBeenCalledTimes(1);
  });

  it('prefers reject when preferReject=true', async () => {
    const page = makeBasePageMock();

    const rejectSelector = '#onetrust-reject-all-handler';

    page.locator = vi.fn((sel: string) => {
      const present = sel === rejectSelector; // only reject exists
      return makeLocator({ count: vi.fn().mockResolvedValue(present ? 1 : 0) });
    }) as any;

    page.getByRole = vi.fn(() => makeLocator()) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      preferReject: true,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
    });

    const rejectLoc = (page.locator as any).mock.results.find((r: any, i: number) => (page.locator as any).mock.calls[i][0] === rejectSelector)?.value;
    expect(rejectLoc?.click).toHaveBeenCalledTimes(1);
  });

  it('uses overlay heuristic via page.evaluate and stops (no delay)', async () => {
    const page = makeBasePageMock();

    // No known CMPs or dialog buttons
    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.getByRole = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;

    // overlay heuristic returns true once
    const evaluate = vi.fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);
    page.evaluate = evaluate as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
    });

    expect(evaluate).toHaveBeenCalled();
  });

  it('stops early when nothing happens (quiet/min sweep 0)', async () => {
    const page = makeBasePageMock();

    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.getByRole = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    const start = Date.now();

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 25,
      quietPeriodMs: 0,
      minSweepMs: 0,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // should complete almost instantly

    // Ensure we never clicked anything
    const anyLocator = page.locator as any;
    if (anyLocator.mock?.results?.length) {
      for (const r of anyLocator.mock.results) {
        const loc = r.value;
        if (loc && 'click' in loc) {
          expect(loc.click).not.toHaveBeenCalled();
        }
      }
    }
  });
});
