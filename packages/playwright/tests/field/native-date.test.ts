import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setNativeDate } from '../../src/field/native-date';

describe('setNativeDate', () => {
  const createMockLocator = () => {
    const mock = {
      fill: vi.fn(),
      locator: vi.fn(),
    } as unknown as Locator & {
      fill: ReturnType<typeof vi.fn>;
      locator: ReturnType<typeof vi.fn>;
    };

    const inputsMock = {
      count: vi.fn(),
      nth: vi.fn(),
    };

    mock.locator.mockReturnValue(inputsMock);

    return { mock, inputsMock };
  };

  it('returns false for non-date values', async () => {
    const { mock } = createMockLocator();
    expect(await setNativeDate({ el: mock, tag: 'input', type: 'date' }, '2024-01-01' as any)).toBe(false);
  });

  it('sets single date for supported input types', async () => {
    const { mock } = createMockLocator();
    const date = new Date(2024, 0, 15, 14, 30); // 2024-01-15 14:30

    expect(await setNativeDate({ el: mock, tag: 'input', type: 'date' }, date)).toBe(true);
    expect(mock.fill).toHaveBeenLastCalledWith('2024-01-15', undefined);

    expect(await setNativeDate({ el: mock, tag: 'input', type: 'datetime-local' }, date)).toBe(true);
    expect(mock.fill).toHaveBeenLastCalledWith('2024-01-15T14:30', undefined);

    expect(await setNativeDate({ el: mock, tag: 'input', type: 'month' }, date)).toBe(true);
    expect(mock.fill).toHaveBeenLastCalledWith('2024-01', undefined);

    expect(await setNativeDate({ el: mock, tag: 'input', type: 'time' }, date)).toBe(true);
    expect(mock.fill).toHaveBeenLastCalledWith('14:30', undefined);
  });

  it('returns false for single date if tag is not input or type is unsupported', async () => {
    const { mock } = createMockLocator();
    const date = new Date();
    expect(await setNativeDate({ el: mock, tag: 'div', type: 'date' }, date)).toBe(false);
    expect(await setNativeDate({ el: mock, tag: 'input', type: 'text' }, date)).toBe(false);
  });

  it('sets date range for container with two date inputs', async () => {
    const { mock, inputsMock } = createMockLocator();
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);
    
    inputsMock.count.mockResolvedValue(2);
    const fromInput = { fill: vi.fn() };
    const toInput = { fill: vi.fn() };
    inputsMock.nth.mockImplementation((i) => (i === 0 ? fromInput : toInput));

    const result = await setNativeDate({ el: mock, tag: 'div', type: null }, { from, to });
    
    expect(result).toBe(true);
    expect(fromInput.fill).toHaveBeenCalledWith('2024-01-01', undefined);
    expect(toInput.fill).toHaveBeenCalledWith('2024-01-31', undefined);
  });

  it('returns false for date range if tag is input/select/textarea/button', async () => {
    const { mock } = createMockLocator();
    const range = { from: new Date(), to: new Date() };
    expect(await setNativeDate({ el: mock, tag: 'input', type: 'text' }, range)).toBe(false);
    expect(await setNativeDate({ el: mock, tag: 'select', type: null }, range)).toBe(false);
  });

  it('returns false for date range if input count is not 2', async () => {
    const { mock, inputsMock } = createMockLocator();
    const range = { from: new Date(), to: new Date() };
    inputsMock.count.mockResolvedValue(1);
    expect(await setNativeDate({ el: mock, tag: 'div', type: null }, range)).toBe(false);
  });
});
