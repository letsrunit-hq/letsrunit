import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { selectNative } from '../../src/field/native-select';

describe('selectNative', () => {
  const createMockLocator = () => {
    return {
      evaluate: vi.fn(),
      selectOption: vi.fn(),
    } as unknown as Locator & {
      evaluate: ReturnType<typeof vi.fn>;
      selectOption: ReturnType<typeof vi.fn>;
    };
  };

  it('returns false if tag is not select', async () => {
    const mock = createMockLocator();
    const result = await selectNative({ el: mock, tag: 'div', type: null }, 'value');
    expect(result).toBe(false);
  });

  it('returns false for Date or Range values', async () => {
    const mock = createMockLocator();
    expect(await selectNative({ el: mock, tag: 'select', type: null }, new Date())).toBe(false);
    expect(await selectNative({ el: mock, tag: 'select', type: null }, { from: 1, to: 2 })).toBe(false);
  });

  it('clears multiple select when value is null', async () => {
    const mock = createMockLocator();
    mock.evaluate.mockImplementation((fn) => {
      const el = { multiple: true, options: [] };
      return fn(el as any);
    });

    const result = await selectNative({ el: mock, tag: 'select', type: null }, null);
    expect(result).toBe(true);
    expect(mock.selectOption).toHaveBeenCalledWith([], undefined);
  });

  it('clears single select with empty option when value is null', async () => {
    const mock = createMockLocator();
    mock.evaluate.mockImplementation((fn) => {
      const el = {
        multiple: false,
        options: [{ value: '', disabled: false }],
      };
      return fn(el as any);
    });

    const result = await selectNative({ el: mock, tag: 'select', type: null }, null);
    expect(result).toBe(true);
    expect(mock.selectOption).toHaveBeenCalledWith({ value: '' }, undefined);
  });

  it('clears single select by selecting first enabled option when value is null and no empty option', async () => {
    const mock = createMockLocator();
    mock.evaluate.mockImplementation((fn) => {
      const el = {
        multiple: false,
        options: [
          { value: '1', disabled: true },
          { value: '2', disabled: false },
        ],
      };
      return fn(el as any);
    });

    const result = await selectNative({ el: mock, tag: 'select', type: null }, null);
    expect(result).toBe(true);
    expect(mock.selectOption).toHaveBeenCalledWith({ value: '2' }, undefined);
  });

  it('performs multi-select when value is an array', async () => {
    const mock = createMockLocator();
    mock.evaluate.mockResolvedValue(true); // isMultiple
    mock.selectOption.mockResolvedValue(['val1', 'val2']);

    const result = await selectNative({ el: mock, tag: 'select', type: null }, ['val1', 'val2']);
    expect(result).toBe(true);
    expect(mock.selectOption).toHaveBeenCalledWith(['val1', 'val2'], undefined);
  });

  it('throws error in multi-select if select is not multiple', async () => {
    const mock = createMockLocator();
    mock.evaluate.mockResolvedValue(false); // isMultiple

    await expect(selectNative({ el: mock, tag: 'select', type: null }, ['val1'])).rejects.toThrow('Select is not multiple');
  });

  it('throws error in multi-select if some options are missing', async () => {
    const mock = createMockLocator();
    mock.evaluate.mockResolvedValue(true); // isMultiple
    mock.selectOption.mockResolvedValue(['val1']);

    await expect(selectNative({ el: mock, tag: 'select', type: null }, ['val1', 'val2'])).rejects.toThrow('Options not found in select: val2');
  });

  it('performs single select when value is scalar', async () => {
    const mock = createMockLocator();
    mock.selectOption.mockResolvedValue(['val1']);

    const result = await selectNative({ el: mock, tag: 'select', type: null }, 'val1');
    expect(result).toBe(true);
    expect(mock.selectOption).toHaveBeenCalledWith('val1', undefined);
  });

  it('throws error in single select if option not found', async () => {
    const mock = createMockLocator();
    mock.selectOption.mockResolvedValue([]);

    await expect(selectNative({ el: mock, tag: 'select', type: null }, 'val1')).rejects.toThrow('Option "val1" not found in select');
  });

  it('returns false for array of Dates', async () => {
    const mock = createMockLocator();
    const result = await selectNative({ el: mock, tag: 'select', type: null }, [new Date()]);
    expect(result).toBe(false);
  });
});
