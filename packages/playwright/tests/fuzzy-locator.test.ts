import { Locator, Page } from '@playwright/test';
import { describe, expect, test, vi } from 'vitest';
import { fuzzyLocator } from '../src';

type LocatorCall = {
  selector: string;
  options?: Parameters<Page['locator']>[1];
};

type MockedLocator = Locator & {
  __id: string;
  or: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
};

function locatorId(selector: string, options?: Parameters<Page['locator']>[1]): string {
  const hasText = options?.hasText;
  return hasText ? `${selector} [hasText=${String(hasText)}]` : selector;
}

function createMockContext() {
  const orCalls: Array<[string, string]> = [];
  const firstCalls: string[] = [];
  const countCalls: string[] = [];
  const locatorCalls: LocatorCall[] = [];

  const makeLocator = (id: string): MockedLocator => {
    const loc = {
      __id: id,
      or: vi.fn((other: Locator) => {
        const rhs = other as MockedLocator;
        orCalls.push([id, rhs.__id]);
        return makeLocator(`(${id}) OR (${rhs.__id})`);
      }),
      first: vi.fn(() => {
        firstCalls.push(id);
        return makeLocator(`FIRST(${id})`);
      }),
      count: vi.fn(async () => {
        countCalls.push(id);
        return 0;
      }),
    } as unknown as MockedLocator;

    return loc;
  };

  const page = {
    locator: vi.fn((selector: string, options?: Parameters<Page['locator']>[1]) => {
      locatorCalls.push({ selector, options });
      return makeLocator(locatorId(selector, options));
    }),
  } as unknown as Page;

  return { page, locatorCalls, orCalls, firstCalls, countCalls };
}

describe('fuzzyLocator', () => {
  test('is defined', () => {
    expect(fuzzyLocator).toBeDefined();
  });

  test('returns primary first locator when selector has no fallback patterns', async () => {
    const ctx = createMockContext();

    const result = (await fuzzyLocator(ctx.page, 'my-selector')) as MockedLocator;

    expect(result.__id).toBe('FIRST(my-selector)');
    expect(ctx.locatorCalls).toEqual([{ selector: 'my-selector', options: undefined }]);
    expect(ctx.orCalls).toEqual([]);
    expect(ctx.firstCalls).toEqual(['my-selector']);
  });

  test('adds role+name fallbacks lazily in stable order', async () => {
    const ctx = createMockContext();

    const result = (await fuzzyLocator(ctx.page, 'role=button[name="Save"]')) as MockedLocator;

    expect(ctx.locatorCalls).toEqual([
      { selector: 'role=button[name="Save"]', options: undefined },
      { selector: 'role=button', options: { hasText: 'Save' } },
      { selector: 'css=button', options: { hasText: 'Save' } },
      { selector: 'text=Save >> xpath=following-sibling::* >> role=button', options: undefined },
      { selector: 'field=Save', options: undefined },
    ]);

    expect(ctx.orCalls).toEqual([
      ['role=button[name="Save"]', 'role=button [hasText=Save]'],
      ['(role=button[name="Save"]) OR (role=button [hasText=Save])', 'css=button [hasText=Save]'],
      [
        '((role=button[name="Save"]) OR (role=button [hasText=Save])) OR (css=button [hasText=Save])',
        'text=Save >> xpath=following-sibling::* >> role=button',
      ],
      [
        '(((role=button[name="Save"]) OR (role=button [hasText=Save])) OR (css=button [hasText=Save])) OR (text=Save >> xpath=following-sibling::* >> role=button)',
        'field=Save',
      ],
    ]);

    expect(ctx.firstCalls).toEqual([
      '((((role=button[name="Save"]) OR (role=button [hasText=Save])) OR (css=button [hasText=Save])) OR (text=Save >> xpath=following-sibling::* >> role=button)) OR (field=Save)',
    ]);

    expect(result.__id).toContain('FIRST(');
  });

  test('maps role=link fallback to css=a', async () => {
    const ctx = createMockContext();

    await fuzzyLocator(ctx.page, 'role=link[name="Home"]');

    const cssAttempt = ctx.locatorCalls.find((call) => call.selector === 'css=a');
    expect(cssAttempt).toEqual({ selector: 'css=a', options: { hasText: 'Home' } });
  });

  test('skips field fallback for non-field roles', async () => {
    const ctx = createMockContext();

    await fuzzyLocator(ctx.page, 'role=heading[name="Title"]');

    const fieldAttempt = ctx.locatorCalls.find((call) => call.selector.startsWith('field='));
    expect(fieldAttempt).toBeUndefined();
  });

  test('adds field alternative only for valid CSS id labels', async () => {
    const valid = createMockContext();
    await fuzzyLocator(valid.page, 'field="email"');
    expect(valid.locatorCalls).toEqual([
      { selector: 'field="email"', options: undefined },
      { selector: '#email > input', options: undefined },
    ]);

    const invalid = createMockContext();
    await fuzzyLocator(invalid.page, 'field="What needs to be done?"i');
    expect(invalid.locatorCalls).toEqual([{ selector: 'field="What needs to be done?"i', options: undefined }]);
  });

  test('does not use eager count checks (race-safe lazy fallback composition)', async () => {
    const ctx = createMockContext();

    await fuzzyLocator(ctx.page, 'role=button[name="Antenna"]');

    expect(ctx.countCalls).toEqual([]);
    expect(ctx.orCalls.length).toBeGreaterThan(0);
  });
});
