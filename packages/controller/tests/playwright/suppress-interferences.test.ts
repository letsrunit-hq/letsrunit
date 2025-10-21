import type { Page } from '@playwright/test';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const timeRef = { now: 0 };

const sleepMock = vi.fn((ms: number) => {
  timeRef.now += ms;
  return Promise.resolve();
});

vi.mock('@letsrunit/core/utils', () => ({
  sleep: sleepMock,
}));

vi.mock('@playwright/test', () => ({
  Page: class {},
}));

import { suppressInterferences } from '../src/suppress-interferences';

interface LocatorBehavior {
  count?: () => number;
  onClick?: () => void | Promise<void>;
}

interface LocatorMock {
  first: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  click: ReturnType<typeof vi.fn>;
  scrollIntoViewIfNeeded: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  getByRole: ReturnType<typeof vi.fn>;
}

function createLocator(behavior?: LocatorBehavior): LocatorMock {
  const locator: Partial<LocatorMock> = {};

  locator.first = vi.fn(() => locator as LocatorMock);
  locator.count = vi.fn(async () => (behavior?.count ? behavior.count() : 0));
  locator.click = vi.fn(async () => {
    if (behavior?.onClick) await behavior.onClick();
  });
  locator.scrollIntoViewIfNeeded = vi.fn(async () => {});
  locator.filter = vi.fn(() => createLocator());
  locator.getByRole = vi.fn(() => createLocator());

  return locator as LocatorMock;
}

interface PageStub {
  page: PageLike;
  locatorCache: Record<string, LocatorMock>;
}

type PageLike = Pick<Page, 'locator' | 'getByRole' | 'evaluate' | 'on'> & {
  locator: ReturnType<typeof vi.fn>;
  getByRole: ReturnType<typeof vi.fn>;
  evaluate: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

function createPageStub(config: {
  locatorBehaviors?: Record<string, LocatorBehavior>;
  dialogLocator?: LocatorMock;
  evaluateResult?: boolean;
} = {}): PageStub {
  const locatorCache: Record<string, LocatorMock> = {};
  const page: PageLike = {
    locator: vi.fn((selector: string) => {
      if (!locatorCache[selector]) {
        const behavior = config.locatorBehaviors?.[selector];
        locatorCache[selector] = createLocator(behavior);
      }
      return locatorCache[selector];
    }),
    getByRole: vi.fn((role: string) => {
      if (role === 'dialog' && config.dialogLocator) {
        return config.dialogLocator;
      }
      return createLocator();
    }),
    evaluate: vi.fn(async () => config.evaluateResult ?? false),
    on: vi.fn(),
  };

  return { page, locatorCache };
}

describe('suppressInterferences', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    timeRef.now = 0;
    sleepMock.mockClear();
    nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => timeRef.now);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('clicks reject button for known CMPs when preferReject is true', async () => {
    let rejectClicked = false;
    const { page, locatorCache } = createPageStub({
      locatorBehaviors: {
        '#onetrust-reject-all-handler': {
          count: () => (rejectClicked ? 0 : 1),
          onClick: () => {
            rejectClicked = true;
            timeRef.now += 10;
          },
        },
      },
    });

    await suppressInterferences(page as unknown as Page, {
      preferReject: true,
      timeoutMs: 2000,
    });

    const rejectLocator = locatorCache['#onetrust-reject-all-handler'];
    expect(rejectLocator).toBeDefined();
    expect(rejectLocator!.click).toHaveBeenCalledTimes(1);
    expect(page.locator).toHaveBeenCalledWith('#onetrust-reject-all-handler');
    expect(locatorCache['#onetrust-accept-btn-handler']).toBeUndefined();
    expect(sleepMock.mock.calls.some(([ms]) => ms === 300)).toBe(true);
  });

  it('uses translated phrases when provided via options', async () => {
    const dialogLocator = createLocator({ count: () => 1 });
    const capturedRegexes: RegExp[] = [];

    dialogLocator.getByRole.mockImplementation((role: string, options?: { name?: unknown }) => {
      if (options?.name instanceof RegExp) {
        capturedRegexes.push(options.name);
      }
      return createLocator();
    });

    const { page } = createPageStub({ dialogLocator });

    const translateMock = vi.fn(async () => ({
      accept: ['weiter'],
      reject: ['nein danke'],
      close: ['schliessen'],
    }));

    await suppressInterferences(page as unknown as Page, {
      translate: translateMock,
      timeoutMs: 2000,
    });

    expect(translateMock).toHaveBeenCalledTimes(1);
    expect(translateMock.mock.calls[0][1]).toContain('Given a JSON object');
    expect(capturedRegexes.some(rx => rx.test('nein danke'))).toBe(true);
  });

  it('stops after reaching the maximum action limit', async () => {
    let clickCount = 0;
    const { page, locatorCache } = createPageStub({
      locatorBehaviors: {
        '#onetrust-accept-btn-handler': {
          count: () => 1,
          onClick: () => {
            clickCount += 1;
            timeRef.now += 10;
          },
        },
      },
    });

    await suppressInterferences(page as unknown as Page, { timeoutMs: 2000 });

    const acceptLocator = locatorCache['#onetrust-accept-btn-handler'];
    expect(acceptLocator).toBeDefined();
    expect(acceptLocator!.click).toHaveBeenCalledTimes(6);
    expect(clickCount).toBe(6);
    const settleSleeps = sleepMock.mock.calls.filter(([ms]) => ms === 300);
    expect(settleSleeps).toHaveLength(6);
  });
});
