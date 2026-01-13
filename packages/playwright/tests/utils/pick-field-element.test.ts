import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { pickFieldElement } from '../../src/utils/pick-field-element';

describe('pickFieldElement', () => {
  const createMockLocator = (elements: any[]) => {
    return {
      count: vi.fn(async () => elements.length),
      nth: vi.fn((index) => {
        const el = elements[index];
        return {
          evaluate: vi.fn(async (fn: any) => fn(el)),
          getAttribute: vi.fn(async (name: string) => el.getAttribute(name)),
          fill: vi.fn(async () => {}),
        } as unknown as Locator;
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

    // Should pick inputMock because offset doesn't matter anymore, only type/aria-hidden
    const result = await pickFieldElement(multiLocator);
    await result.evaluate(() => {});
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
    await result.evaluate(() => {});
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
    // It should pick parent because child is aria-hidden and parent contains child
    const result = await pickFieldElement(multiLocator);
    await result.evaluate(() => {});
  });

  it('fails with multiple elements if no rule matches', async () => {
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
    await expect(result.evaluate(() => {})).rejects.toThrow(
      'strict mode violation: locator resolved to 2 elements',
    );
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
    // Should pick visibleInputMock because hiddenInputMock is type="hidden"
    const result = await pickFieldElement(multiLocator);
    await result.evaluate(() => {});
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
    // Should pick visibleInputMock because ariaHiddenInputMock has aria-hidden="true"
    const result = await pickFieldElement(multiLocator);
    await result.evaluate(() => {});
  });
});
