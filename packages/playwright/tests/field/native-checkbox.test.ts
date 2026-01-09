import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setNativeCheckbox } from '../../src/field/native-checkbox';

describe('setNativeCheckbox', () => {
  const createMockLocator = () => {
    return {
      check: vi.fn(),
      uncheck: vi.fn(),
    } as unknown as Locator & {
      check: ReturnType<typeof vi.fn>;
      uncheck: ReturnType<typeof vi.fn>;
    };
  };

  it('returns false if tag is not input or type is not checkbox', async () => {
    const mock = createMockLocator();
    expect(await setNativeCheckbox({ el: mock, tag: 'div', type: 'checkbox' }, true)).toBe(false);
    expect(await setNativeCheckbox({ el: mock, tag: 'input', type: 'text' }, true)).toBe(false);
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
