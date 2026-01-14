import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setNativeCheckbox } from '../../src/field/native-checkbox';

describe('setNativeCheckbox', () => {
  const createMockLocator = (children: any[] = []) => {
    return {
      check: vi.fn(),
      uncheck: vi.fn(),
      locator: vi.fn((selector) => {
        if (selector === 'input[type=checkbox]' || selector === 'input[type=checkbox], input[type=radio]') {
          return {
            count: vi.fn(async () => children.length),
            check: vi.fn(),
            uncheck: vi.fn(),
          };
        }
        return { count: vi.fn(async () => 0) };
      }),
    } as unknown as Locator & {
      check: ReturnType<typeof vi.fn>;
      uncheck: ReturnType<typeof vi.fn>;
      locator: ReturnType<typeof vi.fn>;
    };
  };

  it('returns false if tag is not input or type is not checkbox and no descendant checkbox', async () => {
    const mock = createMockLocator();
    expect(await setNativeCheckbox({ el: mock, tag: 'div', type: null }, true)).toBe(false);
  });

  it('works if component has a single input[type=checkbox] descendant', async () => {
    const childMock = {
      check: vi.fn(),
      uncheck: vi.fn(),
    };
    const mock = {
      locator: vi.fn((selector) => {
        if (selector === 'input[type=checkbox]' || selector === 'input[type=checkbox], input[type=radio]') {
          return {
            count: vi.fn(async () => 1),
            check: childMock.check,
            uncheck: childMock.uncheck,
          };
        }
        return { count: vi.fn(async () => 0) };
      }),
    } as unknown as Locator;

    const result = await setNativeCheckbox({ el: mock, tag: 'div', type: null }, true);
    expect(result).toBe(true);
    expect(childMock.check).toHaveBeenCalled();
  });

  it('returns false if component has multiple input[type=checkbox] descendants', async () => {
    const mock = {
      locator: vi.fn((selector) => {
        if (selector === 'input[type=checkbox]' || selector === 'input[type=checkbox], input[type=radio]') {
          return {
            count: vi.fn(async () => 2),
          };
        }
        return { count: vi.fn(async () => 0) };
      }),
    } as unknown as Locator;

    const result = await setNativeCheckbox({ el: mock, tag: 'div', type: null }, true);
    expect(result).toBe(false);
  });

  it('returns false if component is textarea or select', async () => {
    const mock = createMockLocator([{ tag: 'input', type: 'checkbox' }]);
    expect(await setNativeCheckbox({ el: mock, tag: 'textarea', type: null }, true)).toBe(false);
    expect(await setNativeCheckbox({ el: mock, tag: 'select', type: null }, true)).toBe(false);
  });

  it('returns false if value is not boolean or null', async () => {
    const mock = createMockLocator();
    expect(await setNativeCheckbox({ el: mock, tag: 'input', type: 'checkbox' }, 'true' as any)).toBe(false);
  });

  it('checks when value is true', async () => {
    const mock = createMockLocator();
    const result = await setNativeCheckbox({ el: mock, tag: 'input', type: 'checkbox' }, true);
    expect(result).toBe(true);
    expect(mock.check).toHaveBeenCalled();
  });

  it('unchecks when value is false', async () => {
    const mock = createMockLocator();
    const result = await setNativeCheckbox({ el: mock, tag: 'input', type: 'checkbox' }, false);
    expect(result).toBe(true);
    expect(mock.uncheck).toHaveBeenCalled();
  });

  it('unchecks when value is null', async () => {
    const mock = createMockLocator();
    const result = await setNativeCheckbox({ el: mock, tag: 'input', type: 'checkbox' }, null);
    expect(result).toBe(true);
    expect(mock.uncheck).toHaveBeenCalled();
  });
});
