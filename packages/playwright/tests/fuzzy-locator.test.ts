import { Locator, Page } from '@playwright/test';
import { describe, expect, test, vi } from 'vitest';
import { fuzzyLocator } from '../src';

describe('fuzzyLocator', () => {
  test('is defined', () => {
    expect(fuzzyLocator).toBeDefined();
  });

  test('returns primary locator if found', async () => {
    const mockLocator = {
      first: () => mockLocator,
      count: async () => 1,
    } as unknown as Locator;

    const mockPage = {
      locator: vi.fn().mockReturnValue(mockLocator),
    } as unknown as Page;

    const result = await fuzzyLocator(mockPage, 'my-selector');
    expect(result).toBe(mockLocator);
    expect(mockPage.locator).toHaveBeenCalledWith('my-selector');
  });

  test('tries fallbacks if primary not found', async () => {
    const primaryLocator = {
      first: () => primaryLocator,
      count: async () => 0,
    } as unknown as Locator;

    const fallbackLocator = {
      first: () => fallbackLocator,
      count: async () => 1,
    } as unknown as Locator;

    const mockPage = {
      locator: vi
        .fn()
        .mockReturnValueOnce(primaryLocator) // primary
        .mockReturnValue(fallbackLocator), // any fallback
    } as unknown as Page;

    const result = await fuzzyLocator(mockPage, 'role=button[name="Foo"]');
    expect(result).toBe(fallbackLocator);
  });

  test('tryFieldAlternative does not crash on field names with special characters', async () => {
    const emptyLocator = {
      first: () => emptyLocator,
      count: async () => 0,
    } as unknown as Locator;

    const mockPage = {
      locator: vi.fn().mockReturnValue(emptyLocator),
    } as unknown as Page;

    // Should not throw even though "What needs to be done?" is not a valid CSS ID
    const result = await fuzzyLocator(mockPage, 'field="What needs to be done?"i');
    expect(result).toBe(emptyLocator);
    // The CSS ID fallback must NOT have been attempted with the raw invalid selector
    const cssIdAttempts = (mockPage.locator as ReturnType<typeof vi.fn>).mock.calls
      .map((args: string[]) => args[0])
      .filter((sel: string) => sel.startsWith('#'));
    expect(cssIdAttempts).toHaveLength(0);
  });
});
