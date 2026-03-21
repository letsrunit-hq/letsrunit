import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { suppressInterferences } from '../src/suppress-interferences';

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
      on: typeof on;
      evaluate: typeof evaluate;
      getByRole: typeof getByRole;
      locator: typeof locator;
    };
  };
}

function makeLocator(overrides?: Partial<any>) {
  const click = vi.fn().mockResolvedValue(undefined);
  const scrollIntoViewIfNeeded = vi.fn().mockResolvedValue(undefined);
  const count = vi.fn().mockResolvedValue(0);
  const first = vi.fn().mockImplementation(function (this: any) {
    return this;
  });
  const getByRole = function (this: any) {
    return this;
  } as any;

  const filter = function (this: any) {
    return this;
  } as any;

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

    const acceptLoc = (page.locator as any).mock.results.find(
      (r: any, i: number) => (page.locator as any).mock.calls[i][0] === accSelector,
    )?.value;
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

    const rejectLoc = (page.locator as any).mock.results.find(
      (r: any, i: number) => (page.locator as any).mock.calls[i][0] === rejectSelector,
    )?.value;
    expect(rejectLoc?.click).toHaveBeenCalledTimes(1);
  });

  it('uses overlay heuristic via page.evaluate and stops (no delay)', async () => {
    const page = makeBasePageMock();

    // No known CMPs or dialog buttons
    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.getByRole = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;

    // overlay heuristic returns true once
    const evaluate = vi.fn().mockResolvedValueOnce(true).mockResolvedValue(false);
    page.evaluate = evaluate as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
    });

    expect(evaluate).toHaveBeenCalled();
  });

  it('sweeps newsletter modal with email input and close button', async () => {
    const page = makeBasePageMock();

    const closeBtn = makeLocator({ count: vi.fn().mockResolvedValue(1) });
    const newsletterModal = {
      ...makeLocator({ count: vi.fn().mockResolvedValue(1) }),
      filter: function (this: any) {
        return this;
      },
      getByRole: () => closeBtn,
    };

    // Known CMPs must return count=0; only *:visible returns the modal
    page.locator = vi.fn((sel: string) => {
      if (sel === '*:visible') return newsletterModal;
      return makeLocator({ count: vi.fn().mockResolvedValue(0) });
    }) as any;

    // No dialog or generic button match
    page.getByRole = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 500,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
    });

    expect(closeBtn.click).toHaveBeenCalledTimes(1);
  });

  it('buildRegexFromTranslations produces a case-insensitive regex via suppressInterferences', async () => {
    const page = makeBasePageMock();

    // Capture the button name used in getByRole calls
    const capturedNames: RegExp[] = [];
    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.getByRole = vi.fn((_role: string, opts?: { name?: RegExp }) => {
      if (opts?.name) capturedNames.push(opts.name);
      return makeLocator({ count: vi.fn().mockResolvedValue(0) });
    }) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      lang: 'en',
      quietPeriodMs: 0,
      minSweepMs: 0,
      pollIntervalMs: 0,
    });

    // Some accept/reject regex should have been built and passed to getByRole
    const anyRegex = capturedNames.find((r) => r instanceof RegExp);
    expect(anyRegex).toBeTruthy();
    if (anyRegex) expect(anyRegex.flags).toContain('i');
  });

  it('clicks a generic accept button (no dialog role) when no CMP or dialog matches', async () => {
    const page = makeBasePageMock();

    // No known CMPs
    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;

    // No dialogs, but a generic accept button exists
    const genericBtn = makeLocator({ count: vi.fn().mockResolvedValue(1) });
    page.getByRole = vi.fn((role: string) => {
      if (role === 'dialog') return makeLocator({ count: vi.fn().mockResolvedValue(0) });
      if (role === 'button') return { first: () => genericBtn };
      return makeLocator({ count: vi.fn().mockResolvedValue(0) });
    }) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
      lang: 'en',
    });

    expect(genericBtn.click).toHaveBeenCalledTimes(1);
  });

  it('clicks dialog close button when no accept/reject buttons exist', async () => {
    const page = makeBasePageMock();

    // No known CMPs
    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;

    // Close button has count=1; accept/reject buttons have count=0
    const closeBtn = makeLocator({ count: vi.fn().mockResolvedValue(1) });
    const noneBtn = makeLocator({ count: vi.fn().mockResolvedValue(0) });

    const dialogsLocator = {
      count: vi.fn().mockResolvedValue(1),
      getByRole: vi.fn().mockImplementation((_role: string, opts?: { name?: RegExp }) => {
        const isClose = opts?.name instanceof RegExp && opts.name.source.includes('close');
        return { first: () => (isClose ? closeBtn : noneBtn) };
      }),
    };

    page.getByRole = vi.fn((role: string) => {
      if (role === 'dialog') return dialogsLocator;
      return makeLocator({ count: vi.fn().mockResolvedValue(0) });
    }) as any;

    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
      lang: 'en',
    });

    expect(closeBtn.click).toHaveBeenCalledTimes(1);
  });

  it('clicks dialog accept button when preferred button is found in dialog (line 108)', async () => {
    const page = makeBasePageMock();

    // No known CMPs
    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;

    // Dialog with a matching accept button (count=1)
    const acceptBtn = makeLocator({ count: vi.fn().mockResolvedValue(1) });
    const dialogsLocator = {
      count: vi.fn().mockResolvedValue(1),
      getByRole: vi.fn().mockReturnValue({ first: () => acceptBtn }),
    };

    page.getByRole = vi.fn((role: string) => {
      if (role === 'dialog') return dialogsLocator;
      return makeLocator({ count: vi.fn().mockResolvedValue(0) });
    }) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
      lang: 'en',
    });

    expect(acceptBtn.click).toHaveBeenCalledTimes(1);
  });

  it('clicks fallback accept/reject button when preferred not found in dialog (lines 116-121)', async () => {
    const page = makeBasePageMock();

    // No known CMPs
    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;

    // Dialog exists; preferred button (first getByRole call) returns count=0; fallback accept has count=1
    const fallbackBtn = makeLocator({ count: vi.fn().mockResolvedValue(1) });
    let callCount = 0;
    const dialogsLocator = {
      count: vi.fn().mockResolvedValue(1),
      getByRole: vi.fn().mockImplementation(() => {
        callCount++;
        // First call: target (preferred) → count=0; subsequent: fallback has count=1
        if (callCount === 1) return makeLocator({ count: vi.fn().mockResolvedValue(0) });
        return { first: () => fallbackBtn };
      }),
    };

    page.getByRole = vi.fn((role: string) => {
      if (role === 'dialog') return dialogsLocator;
      return makeLocator({ count: vi.fn().mockResolvedValue(0) });
    }) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      maxActions: 1,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
      lang: 'en',
    });

    expect(fallbackBtn.click).toHaveBeenCalled();
  });

  it('executes sleep(settleAfterActionMs) after an action when maxActions not yet reached', async () => {
    const page = makeBasePageMock();

    const accSelector = '#onetrust-accept-btn-handler';
    const locCache: Record<string, any> = {};
    page.locator = vi.fn((sel: string) => {
      if (!locCache[sel]) {
        const present = sel === accSelector;
        locCache[sel] = makeLocator({ count: vi.fn().mockResolvedValue(present ? 1 : 0) });
      }
      return locCache[sel];
    }) as any;

    page.getByRole = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    // maxActions=2: after first action (actions=1 < 2), sleep(settleAfterActionMs) runs before continue
    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      maxActions: 2,
      pollIntervalMs: 0,
      settleAfterActionMs: 0,
      quietPeriodMs: 0,
      minSweepMs: 0,
    });

    // Accept button was clicked at least once (line 275 sleep was reached)
    const acceptLoc = (page.locator as any).mock.results.find(
      (_r: any, i: number) => (page.locator as any).mock.calls[i][0] === accSelector,
    )?.value;
    expect(acceptLoc?.click).toHaveBeenCalled();
  });

  it('calls sleep(pollIntervalMs) when nothing happens and quiet period not yet elapsed', async () => {
    const page = makeBasePageMock();

    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.getByRole = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    // quietPeriodMs=800 > timeoutMs=50: the quiet exit won't trigger during the 50ms run
    // so at least one sleep(pollIntervalMs=0) should be executed before timeout
    const start = Date.now();

    await suppressInterferences(page as unknown as Page, {
      timeoutMs: 50,
      quietPeriodMs: 800,
      minSweepMs: 0,
      pollIntervalMs: 0,
      maxActions: 1,
    });

    // Should have run the loop a few times and called evaluate (overlay heuristic)
    expect(page.evaluate).toHaveBeenCalled();
    expect(Date.now() - start).toBeGreaterThanOrEqual(40); // ran for roughly the timeout
  });

  it('uses default timeoutMs and pollIntervalMs when not provided', async () => {
    const page = makeBasePageMock();

    page.locator = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.getByRole = vi.fn(() => makeLocator({ count: vi.fn().mockResolvedValue(0) })) as any;
    page.evaluate = vi.fn().mockResolvedValue(false) as any;

    // quietPeriodMs=0 and minSweepMs=0 exit after the first iteration — so the
    // default timeoutMs (4000) and pollIntervalMs (120) are assigned but never
    // actually waited on, keeping the test fast while covering those ?? branches.
    await suppressInterferences(page as unknown as Page, {
      quietPeriodMs: 0,
      minSweepMs: 0,
    });

    expect(page.evaluate).toHaveBeenCalled(); // overlay sweep ran
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
