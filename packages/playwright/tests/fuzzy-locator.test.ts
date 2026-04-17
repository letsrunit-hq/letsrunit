import { Locator, Page } from '@playwright/test';
import { describe, expect, test, vi } from 'vitest';
import { fuzzyLocator } from '../src';

type LocatorCall = {
  selector: string;
  options?: Parameters<Page['locator']>[1];
};

type ClickCall = {
  id: string;
  options: unknown;
};

type ExpectCall = {
  id: string;
  expression: string;
};

type MockedLocator = Locator & {
  __id: string;
  click: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
  locator: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  _expect: ReturnType<typeof vi.fn>;
};

type ContextConfig = {
  counts?: Record<string, number>;
  clickErrors?: string[];
  allResults?: Record<string, string[]>;
};

function locatorId(selector: string, options?: Parameters<Page['locator']>[1]): string {
  const hasText = options?.hasText;
  return hasText ? `${selector} [hasText=${String(hasText)}]` : selector;
}

function createMockContext(config: ContextConfig = {}) {
  const locatorCalls: LocatorCall[] = [];
  const clickCalls: ClickCall[] = [];
  const countCalls: string[] = [];
  const allCalls: string[] = [];
  const locatorChainCalls: Array<{ id: string; child: string }> = [];
  const orCalls: Array<[string, string]> = [];
  const expectCalls: ExpectCall[] = [];
  const cache = new Map<string, MockedLocator>();
  const clickErrors = new Set(config.clickErrors ?? []);

  const makeLocator = (id: string): MockedLocator => {
    const cached = cache.get(id);
    if (cached) return cached;

    const loc = {
      __id: id,
      click: vi.fn(async (options?: unknown) => {
        clickCalls.push({ id, options });
        if (clickErrors.has(id)) {
          throw new Error(`click failed: ${id}`);
        }
      }),
      count: vi.fn(async () => {
        countCalls.push(id);
        return config.counts?.[id] ?? 0;
      }),
      all: vi.fn(async () => {
        allCalls.push(id);
        const values = config.allResults?.[id] ?? [id];
        return values.map((value) => makeLocator(value));
      }),
      locator: vi.fn((child: string) => {
        locatorChainCalls.push({ id, child });
        return makeLocator(`${id} >> ${child}`);
      }),
      or: vi.fn((other: Locator) => {
        const rhs = other as MockedLocator;
        orCalls.push([id, rhs.__id]);
        return makeLocator(`(${id}) OR (${rhs.__id})`);
      }),
      _expect: vi.fn(async (expression: string) => {
        expectCalls.push({ id, expression });
        return { matches: true, received: id };
      }),
      toString: vi.fn(() => id),
    } as unknown as MockedLocator;

    cache.set(id, loc);
    return loc;
  };

  const page = {
    locator: vi.fn((selector: string, options?: Parameters<Page['locator']>[1]) => {
      locatorCalls.push({ selector, options });
      return makeLocator(locatorId(selector, options));
    }),
  } as unknown as Page;

  return {
    page,
    locatorCalls,
    clickCalls,
    countCalls,
    allCalls,
    locatorChainCalls,
    orCalls,
    expectCalls,
  };
}

describe('fuzzyLocator', () => {
  test('is defined', () => {
    expect(fuzzyLocator).toBeDefined();
  });

  test('uses primary action when it succeeds', async () => {
    const ctx = createMockContext();
    const locator = (await fuzzyLocator(ctx.page, 'my-selector')) as MockedLocator;

    await locator.click({ timeout: 2500 });

    expect(ctx.locatorCalls).toEqual([{ selector: 'my-selector', options: undefined }]);
    expect(ctx.clickCalls).toEqual([{ id: 'my-selector', options: { timeout: 2500 } }]);
    expect(ctx.countCalls).toEqual([]);
  });

  test('tries primary with timeout, then no-wait fallback existence checks', async () => {
    const ctx = createMockContext({
      counts: {
        'role=button [hasText=Save]': 0,
        'css=button [hasText=Save]': 1,
      },
      clickErrors: ['role=button[name="Save"]'],
    });

    const locator = (await fuzzyLocator(ctx.page, 'role=button[name="Save"]')) as MockedLocator;
    await locator.click({ timeout: 2500 });

    expect(ctx.locatorCalls).toEqual([
      { selector: 'role=button[name="Save"]', options: undefined },
      { selector: 'role=button', options: { hasText: 'Save' } },
      { selector: 'css=button', options: { hasText: 'Save' } },
      { selector: 'text=Save >> xpath=following-sibling::* >> role=button', options: undefined },
      { selector: 'field=Save', options: undefined },
    ]);
    expect(ctx.clickCalls).toEqual([
      { id: 'role=button[name="Save"]', options: { timeout: 2500 } },
      { id: 'css=button [hasText=Save]', options: { timeout: 0 } },
    ]);
    expect(ctx.countCalls).toEqual(['role=button [hasText=Save]', 'css=button [hasText=Save]']);
  });

  test('rethrows primary error when no fallback exists', async () => {
    const ctx = createMockContext({
      clickErrors: ['role=button[name="Save"]'],
    });
    const locator = (await fuzzyLocator(ctx.page, 'role=button[name="Save"]')) as MockedLocator;

    await expect(locator.click({ timeout: 1000 })).rejects.toThrow('click failed: role=button[name="Save"]');
    expect(ctx.countCalls).toEqual([
      'role=button [hasText=Save]',
      'css=button [hasText=Save]',
      'text=Save >> xpath=following-sibling::* >> role=button',
      'field=Save',
    ]);
  });

  test('routes toBeVisible and toBeAttached expectations through OR locator', async () => {
    const ctx = createMockContext();
    const locator = (await fuzzyLocator(ctx.page, 'role=button[name="Save"]')) as MockedLocator;

    await (locator as any)._expect('to.be.visible', { timeout: 5000 });
    await (locator as any)._expect('to.be.attached', { timeout: 5000 });

    expect(ctx.orCalls.length).toBeGreaterThan(0);
    expect(ctx.expectCalls.at(-1)?.id).toContain('OR');
  });

  test('all() aggregates all candidate results', async () => {
    const ctx = createMockContext({
      allResults: {
        'role=button[name="Save"]': ['p1'],
        'role=button [hasText=Save]': ['f1'],
        'css=button [hasText=Save]': ['f2'],
        'text=Save >> xpath=following-sibling::* >> role=button': ['f3'],
        'field=Save': ['f4'],
      },
    });
    const locator = (await fuzzyLocator(ctx.page, 'role=button[name="Save"]')) as MockedLocator;

    const result = (await locator.all()) as MockedLocator[];

    expect(ctx.allCalls).toEqual([
      'role=button[name="Save"]',
      'role=button [hasText=Save]',
      'css=button [hasText=Save]',
      'text=Save >> xpath=following-sibling::* >> role=button',
      'field=Save',
    ]);
    expect(result.map((entry) => entry.__id)).toEqual(['p1', 'f1', 'f2', 'f3', 'f4']);
  });

  test('applies ordered fallback behavior on chained locator', async () => {
    const ctx = createMockContext({
      counts: {
        'role=button [hasText=Save] >> svg': 0,
        'css=button [hasText=Save] >> svg': 1,
      },
      clickErrors: ['role=button[name="Save"] >> svg'],
    });
    const locator = (await fuzzyLocator(ctx.page, 'role=button[name="Save"]')) as MockedLocator;

    const child = locator.locator('svg') as MockedLocator;
    await child.click({ timeout: 2500 });

    expect(ctx.locatorChainCalls).toEqual([
      { id: 'role=button[name="Save"]', child: 'svg' },
      { id: 'role=button [hasText=Save]', child: 'svg' },
      { id: 'css=button [hasText=Save]', child: 'svg' },
      { id: 'text=Save >> xpath=following-sibling::* >> role=button', child: 'svg' },
      { id: 'field=Save', child: 'svg' },
    ]);
    expect(ctx.clickCalls).toEqual([
      { id: 'role=button[name="Save"] >> svg', options: { timeout: 2500 } },
      { id: 'css=button [hasText=Save] >> svg', options: { timeout: 0 } },
    ]);
  });

  test('throws for unsupported methods', async () => {
    const ctx = createMockContext();
    const locator = await fuzzyLocator(ctx.page, 'my-selector');

    expect(() => (locator as any).filter({ hasText: 'x' })).toThrow('FallbackLocator does not support filter');
    expect(() => (locator as any).getByRole('button')).toThrow('FallbackLocator does not support getByRole');
    expect(() => (locator as any).getByLabel('name')).toThrow('FallbackLocator does not support getByLabel');
  });
});
