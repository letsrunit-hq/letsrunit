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

  test('tryTagInsteadOfRole: tries css=button when role=button[name="..."] primary fails', async () => {
    function makeLocatorWithCount(count: number) {
      const loc: Record<string, unknown> = {};
      loc['first'] = () => loc;
      loc['count'] = vi.fn().mockResolvedValue(count);
      return loc as unknown as Locator;
    }

    const primaryLocator = makeLocatorWithCount(0);
    const relaxNameLocator = makeLocatorWithCount(0); // tryRelaxNameToHasText
    const tagLocator = makeLocatorWithCount(1);        // tryTagInsteadOfRole

    const mockPage = {
      locator: vi
        .fn()
        .mockReturnValueOnce(primaryLocator)  // primary (role=button[name="Save"])
        .mockReturnValueOnce(relaxNameLocator) // tryRelaxNameToHasText (role=button + hasText)
        .mockReturnValue(tagLocator),          // tryTagInsteadOfRole (css=button + hasText)
    } as unknown as Page;

    const result = await fuzzyLocator(mockPage, 'role=button[name="Save"]');
    expect(result).toBe(tagLocator);
  });

  test('tryTagInsteadOfRole: maps role=link to css=a', async () => {
    function makeLocatorWithCount(count: number) {
      const loc: Record<string, unknown> = {};
      loc['first'] = () => loc;
      loc['count'] = vi.fn().mockResolvedValue(count);
      return loc as unknown as Locator;
    }

    const emptyLocator = makeLocatorWithCount(0);
    const linkLocator = makeLocatorWithCount(1);

    const mockPage = {
      locator: vi
        .fn()
        .mockReturnValueOnce(emptyLocator)  // primary
        .mockReturnValueOnce(emptyLocator)  // tryRelaxNameToHasText
        .mockReturnValue(linkLocator),       // tryTagInsteadOfRole → css=a
    } as unknown as Page;

    const result = await fuzzyLocator(mockPage, 'role=link[name="Home"]');
    expect(result).toBe(linkLocator);

    // Verify the css=a selector was attempted
    const calls = (mockPage.locator as ReturnType<typeof vi.fn>).mock.calls;
    const cssAttempt = calls.find((args: string[]) => args[0] === 'css=a');
    expect(cssAttempt).toBeTruthy();
  });

  test('tryAsField: tries field=Email for role=textbox[name="Email"]', async () => {
    function makeLocatorWithCount(count: number) {
      const loc: Record<string, unknown> = {};
      loc['first'] = () => loc;
      loc['count'] = vi.fn().mockResolvedValue(count);
      return loc as unknown as Locator;
    }

    const emptyLocator = makeLocatorWithCount(0);
    const fieldLocator = makeLocatorWithCount(1);

    // Call order for role=textbox[name="Email"]:
    // 1. primary
    // 2. tryRelaxNameToHasText (role=textbox + hasText)
    // 3. tryRoleNameProximity (text=Email >> .. >> role=textbox)
    // 4. tryAsField (field=Email)
    const mockPage = {
      locator: vi
        .fn()
        .mockReturnValueOnce(emptyLocator)  // primary
        .mockReturnValueOnce(emptyLocator)  // tryRelaxNameToHasText
        .mockReturnValueOnce(emptyLocator)  // tryRoleNameProximity
        .mockReturnValue(fieldLocator),      // tryAsField → field=Email
    } as unknown as Page;

    const result = await fuzzyLocator(mockPage, 'role=textbox[name="Email"]');
    expect(result).toBe(fieldLocator);

    const calls = (mockPage.locator as ReturnType<typeof vi.fn>).mock.calls;
    const fieldAttempt = calls.find((args: string[]) => args[0] === 'field=Email');
    expect(fieldAttempt).toBeTruthy();
  });

  test('tryAsField: skips non-field roles (role=heading)', async () => {
    const emptyLocator = {
      first: () => emptyLocator,
      count: async () => 0,
    } as unknown as Locator;

    const mockPage = {
      locator: vi.fn().mockReturnValue(emptyLocator),
    } as unknown as Page;

    const result = await fuzzyLocator(mockPage, 'role=heading[name="Title"]');
    expect(result).toBe(emptyLocator);

    // No field= selector should have been tried
    const calls = (mockPage.locator as ReturnType<typeof vi.fn>).mock.calls;
    const fieldAttempt = calls.find((args: string[]) => (args[0] as string).startsWith('field='));
    expect(fieldAttempt).toBeUndefined();
  });

  test('tryFieldAlternative: tries #id > input when field name is a valid CSS identifier', async () => {
    function makeLocatorWithCount(count: number) {
      const loc: Record<string, unknown> = {};
      loc['first'] = () => loc;
      loc['count'] = vi.fn().mockResolvedValue(count);
      return loc as unknown as Locator;
    }

    const emptyLocator = makeLocatorWithCount(0);
    const idLocator = makeLocatorWithCount(1);

    const mockPage = {
      locator: vi
        .fn()
        .mockReturnValueOnce(emptyLocator) // primary: field="email"
        .mockReturnValue(idLocator),        // tryFieldAlternative: #email > input
    } as unknown as Page;

    const result = await fuzzyLocator(mockPage, 'field="email"');
    expect(result).toBe(idLocator);

    const calls = (mockPage.locator as ReturnType<typeof vi.fn>).mock.calls;
    const idAttempt = calls.find((args: string[]) => args[0] === '#email > input');
    expect(idAttempt).toBeTruthy();
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
