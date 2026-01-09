import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setNativeInput } from '../../src/field/native-input';

describe('setNativeInput', () => {
  const createMockLocator = () => {
    return {
      clear: vi.fn(),
      fill: vi.fn(),
    } as unknown as Locator & {
      clear: ReturnType<typeof vi.fn>;
      fill: ReturnType<typeof vi.fn>;
    };
  };

  it('returns false if tag is not input or textarea', async () => {
    const mock = createMockLocator();
    const result = await setNativeInput({ el: mock, tag: 'div', type: null }, 'value');
    expect(result).toBe(false);
  });

  it('clears input when value is null', async () => {
    const mock = createMockLocator();
    const result = await setNativeInput({ el: mock, tag: 'input', type: 'text' }, null);
    expect(result).toBe(true);
    expect(mock.clear).toHaveBeenCalled();
  });

  it('fills input when value is string', async () => {
    const mock = createMockLocator();
    const result = await setNativeInput({ el: mock, tag: 'input', type: 'text' }, 'hello');
    expect(result).toBe(true);
    expect(mock.fill).toHaveBeenCalledWith('hello', undefined);
  });

  it('fills input when value is number', async () => {
    const mock = createMockLocator();
    const result = await setNativeInput({ el: mock, tag: 'input', type: 'text' }, 123);
    expect(result).toBe(true);
    expect(mock.fill).toHaveBeenCalledWith('123', undefined);
  });

  it('fills textarea when value is string', async () => {
    const mock = createMockLocator();
    const result = await setNativeInput({ el: mock, tag: 'textarea', type: null }, 'hello world');
    expect(result).toBe(true);
    expect(mock.fill).toHaveBeenCalledWith('hello world', undefined);
  });

  it('returns false for unsupported value types', async () => {
    const mock = createMockLocator();
    const result = await setNativeInput({ el: mock, tag: 'input', type: 'text' }, { foo: 'bar' } as any);
    expect(result).toBe(false);
  });
});
