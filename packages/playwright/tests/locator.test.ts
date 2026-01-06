import { Locator, Page } from '@playwright/test';
import { describe, expect, test, vi } from 'vitest';
import { locator } from '../src/locator';

describe('locator', () => {
  test('is defined', () => {
    expect(locator).toBeDefined();
  });

  test('returns primary locator if found', async () => {
    const mockLocator = {
      first: () => mockLocator,
      count: async () => 1,
    } as unknown as Locator;

    const mockPage = {
      locator: vi.fn().mockReturnValue(mockLocator),
    } as unknown as Page;

    const result = await locator(mockPage, 'my-selector');
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

    const result = await locator(mockPage, 'role=button[name="Foo"]');
    expect(result).toBe(fallbackLocator);
  });
});
