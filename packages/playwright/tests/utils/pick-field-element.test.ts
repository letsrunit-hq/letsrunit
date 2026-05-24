import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { createFallbackLocator } from '../../src/fallback-locator';
import { pickFieldElement } from '../../src/utils/pick-field-element';

describe('pickFieldElement', () => {
  const createMockLocator = (elements: any[]) => {
    const singleLocatorFor = (el: any) =>
      ({
        count: vi.fn(async () => 1),
        first: vi.fn().mockReturnThis(),
        nth: vi.fn().mockReturnThis(),
        evaluate: vi.fn(async (fn: any) => fn(el)),
        getAttribute: vi.fn(async (name: string) => el.getAttribute(name)),
        fill: vi.fn(async () => {}),
      }) as unknown as Locator;

    return {
      count: vi.fn(async () => elements.length),
      first: vi.fn(() => singleLocatorFor(elements[0])),
      nth: vi.fn((index) => {
        const el = elements[index];
        return singleLocatorFor(el);
      }),
      evaluateAll: vi.fn(async (fn: any) => fn(elements)),
      evaluate: vi.fn(async (fn: any) => {
        if (elements.length !== 1) {
          throw new Error(`strict mode violation: locator resolved to ${elements.length} elements`);
        }
        return fn(elements[0]);
      }),
      getAttribute: vi.fn(async (name: string) => {
        if (elements.length !== 1) {
          throw new Error(`strict mode violation: locator resolved to ${elements.length} elements`);
        }
        return elements[0].getAttribute(name);
      }),
      fill: vi.fn(async () => {}),
    } as unknown as Locator;
  };

  it('picks the input element even if it has no dimensions (but not hidden)', async () => {
    const inputMock = {
      tagName: 'INPUT',
      getAttribute: (name: string) => (name === 'type' ? 'text' : null),
      offsetWidth: 0,
      offsetHeight: 0,
      getClientRects: () => [],
    };
    const divMock = {
      tagName: 'DIV',
      getAttribute: () => null,
      offsetWidth: 100,
      offsetHeight: 100,
      getClientRects: () => [{}],
    };

    const multiLocator = createMockLocator([inputMock, divMock]);

    const result = await pickFieldElement(multiLocator);
    expect(await result.evaluate((node) => node.tagName)).toBe('INPUT');
  });

  it('picks role="group" when no primary controls are found', async () => {
    const groupMock = {
      tagName: 'DIV',
      getAttribute: (name: string) => (name === 'role' ? 'group' : null),
      offsetWidth: 100,
      offsetHeight: 100,
      getClientRects: () => [{}],
    };
    const divMock = {
      tagName: 'DIV',
      getAttribute: () => null,
      offsetWidth: 100,
      offsetHeight: 100,
      getClientRects: () => [{}],
    };

    const multiLocator = createMockLocator([groupMock, divMock]);
    const result = await pickFieldElement(multiLocator);
    expect(await result.evaluate((node) => node.getAttribute('role'))).toBe('group');
  });

  it('picks the parent element when one contains others', async () => {
    const childMock = {
      tagName: 'INPUT',
      getAttribute: (name: string) => (name === 'aria-hidden' ? 'true' : name === 'type' ? 'text' : null),
      offsetWidth: 0,
      offsetHeight: 0,
      getClientRects: () => [],
      contains: () => false,
    };
    const parentMock = {
      tagName: 'DIV',
      getAttribute: () => null,
      offsetWidth: 100,
      offsetHeight: 100,
      getClientRects: () => [{}],
      contains: (other: any) => other === childMock,
    };

    const multiLocator = createMockLocator([childMock, parentMock]);
    const result = await pickFieldElement(multiLocator);
    expect(await result.evaluate((node) => node.tagName)).toBe('DIV');
  });

  it('falls back to the first element if no rule matches', async () => {
    const div1 = {
      tagName: 'DIV',
      getAttribute: () => null,
      offsetWidth: 100,
      offsetHeight: 100,
      getClientRects: () => [{}],
      contains: () => false,
    };
    const div2 = {
      tagName: 'DIV',
      getAttribute: () => null,
      offsetWidth: 100,
      offsetHeight: 100,
      getClientRects: () => [{}],
      contains: () => false,
    };

    const multiLocator = createMockLocator([div1, div2]);
    const result = await pickFieldElement(multiLocator);
    expect(await result.evaluate((node) => node.tagName)).toBe('DIV');
  });

  it('excludes input[type=hidden] from primary candidates', async () => {
    const hiddenInputMock = {
      tagName: 'INPUT',
      getAttribute: (name: string) => (name === 'type' ? 'hidden' : null),
      offsetWidth: 100,
      offsetHeight: 20,
      getClientRects: () => [{}],
    };
    const visibleInputMock = {
      tagName: 'INPUT',
      getAttribute: (name: string) => (name === 'type' ? 'text' : null),
      offsetWidth: 100,
      offsetHeight: 20,
      getClientRects: () => [{}],
    };

    const multiLocator = createMockLocator([hiddenInputMock, visibleInputMock]);
    const result = await pickFieldElement(multiLocator);
    expect(await result.evaluate((node) => node.getAttribute('type'))).toBe('text');
  });

  it('excludes elements with aria-hidden="true" from primary candidates', async () => {
    const ariaHiddenInputMock = {
      tagName: 'INPUT',
      getAttribute: (name: string) => (name === 'aria-hidden' ? 'true' : name === 'type' ? 'text' : null),
      offsetWidth: 100,
      offsetHeight: 20,
      getClientRects: () => [{}],
    };
    const visibleInputMock = {
      tagName: 'INPUT',
      getAttribute: (name: string) => (name === 'type' ? 'text' : null),
      offsetWidth: 100,
      offsetHeight: 20,
      getClientRects: () => [{}],
    };

    const multiLocator = createMockLocator([ariaHiddenInputMock, visibleInputMock]);
    const result = await pickFieldElement(multiLocator);
    expect(await result.evaluate((node) => node.getAttribute('aria-hidden'))).toBeNull();
  });

  it('resolves a fallback locator to the first present concrete candidate', async () => {
    const missingPrimary = createMockLocator([]);
    const presentFallback = createMockLocator([
      {
        tagName: 'INPUT',
        getAttribute: (name: string) => (name === 'type' ? 'text' : null),
      },
    ]);

    const locator = createFallbackLocator([missingPrimary as unknown as Locator, presentFallback as unknown as Locator]);
    const result = await pickFieldElement(locator);

    expect(await result.evaluate((node) => node.tagName)).toBe('INPUT');
  });
});
