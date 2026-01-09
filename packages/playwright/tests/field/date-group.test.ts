import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setDateGroup } from '../../src/field/date-group';

describe('setDateGroup', () => {
  const createMockLocator = () => {
    const mock = {
      evaluate: vi.fn(),
      selectOption: vi.fn(),
      fill: vi.fn(),
      locator: vi.fn(),
      getAttribute: vi.fn(),
    } as unknown as Locator & {
      evaluate: ReturnType<typeof vi.fn>;
      selectOption: ReturnType<typeof vi.fn>;
      fill: ReturnType<typeof vi.fn>;
      locator: ReturnType<typeof vi.fn>;
      getAttribute: ReturnType<typeof vi.fn>;
    };

    const locatorMock = {
      all: vi.fn().mockResolvedValue([]),
    };
    mock.locator.mockReturnValue(locatorMock);

    return { mock, locatorMock };
  };

  it('returns false if value is not a Date', async () => {
    const { mock } = createMockLocator();
    const result = await setDateGroup({ el: mock, tag: 'div', type: null }, '2024-01-01' as any);
    expect(result).toBe(false);
  });

  it('returns false if tag is input, textarea, or select', async () => {
    const { mock } = createMockLocator();
    const date = new Date();
    expect(await setDateGroup({ el: mock, tag: 'input', type: 'text' }, date)).toBe(false);
    expect(await setDateGroup({ el: mock, tag: 'textarea', type: null }, date)).toBe(false);
    expect(await setDateGroup({ el: mock, tag: 'select', type: null }, date)).toBe(false);
  });

  it('returns false if candidates length is less than 2', async () => {
    const { mock, locatorMock } = createMockLocator();
    locatorMock.all.mockResolvedValue([{}]);
    const result = await setDateGroup({ el: mock, tag: 'div', type: null }, new Date());
    expect(result).toBe(false);
  });

  it('returns false if candidates length is more than 3', async () => {
    const { mock, locatorMock } = createMockLocator();
    locatorMock.all.mockResolvedValue([{}, {}, {}, {}]);
    const result = await setDateGroup({ el: mock, tag: 'div', type: null }, new Date());
    expect(result).toBe(false);
  });

  it('successfully sets date fields based on text signals', async () => {
    const { mock, locatorMock } = createMockLocator();
    const dayEl = { evaluate: vi.fn(), fill: vi.fn() };
    const monthEl = { evaluate: vi.fn(), fill: vi.fn() };
    const yearEl = { evaluate: vi.fn(), fill: vi.fn() };

    dayEl.evaluate.mockResolvedValue({
      tag: 'input',
      name: 'day',
      attrs: {},
      options: [],
    });
    monthEl.evaluate.mockResolvedValue({
      tag: 'input',
      name: 'month',
      attrs: {},
      options: [],
    });
    yearEl.evaluate.mockResolvedValue({
      tag: 'input',
      name: 'year',
      attrs: {},
      options: [],
    });

    locatorMock.all.mockResolvedValue([dayEl, monthEl, yearEl]);

    const date = new Date(2024, 0, 15); // Jan 15, 2024
    const result = await setDateGroup({ el: mock, tag: 'div', type: null }, date);

    expect(result).toBe(true);
    expect(dayEl.fill).toHaveBeenCalledWith('15', undefined);
    expect(monthEl.fill).toHaveBeenCalledWith('1', undefined);
    expect(yearEl.fill).toHaveBeenCalledWith('2024', undefined);
  });

  it('successfully sets date fields with month select', async () => {
    const { mock, locatorMock } = createMockLocator();
    const dayEl = { evaluate: vi.fn(), fill: vi.fn() };
    const monthEl = { evaluate: vi.fn(), selectOption: vi.fn() };
    const yearEl = { evaluate: vi.fn(), fill: vi.fn() };

    dayEl.evaluate.mockResolvedValue({
      tag: 'input',
      name: 'dd',
      attrs: {},
      options: [],
    });
    monthEl.evaluate.mockResolvedValue({
      tag: 'select',
      name: 'mm',
      attrs: {},
      options: [
        { value: '1', text: 'Jan' },
        { value: '2', text: 'Feb' },
      ],
    });
    yearEl.evaluate.mockResolvedValue({
      tag: 'input',
      name: 'yyyy',
      attrs: {},
      options: [],
    });

    locatorMock.all.mockResolvedValue([dayEl, monthEl, yearEl]);

    const date = new Date(2024, 1, 20); // Feb 20, 2024
    const result = await setDateGroup({ el: mock, tag: 'div', type: null }, date);

    expect(result).toBe(true);
    expect(dayEl.fill).toHaveBeenCalledWith('20', undefined);
    expect(monthEl.selectOption).toHaveBeenCalledWith('2', undefined);
    expect(yearEl.fill).toHaveBeenCalledWith('2024', undefined);
  });

  it('falls back to index for month select if value not found', async () => {
    const { mock, locatorMock } = createMockLocator();
    const dayEl = { evaluate: vi.fn(), fill: vi.fn() };
    const monthEl = { evaluate: vi.fn(), selectOption: vi.fn() };
    const yearEl = { evaluate: vi.fn(), fill: vi.fn() };

    dayEl.evaluate.mockResolvedValue({
      tag: 'input',
      name: 'dd',
      attrs: {},
      options: [],
    });
    monthEl.evaluate.mockResolvedValue({
      tag: 'select',
      name: 'mm',
      attrs: {},
      options: Array.from({ length: 12 }, (_, i) => ({ value: `val-${i}`, text: `Month ${i + 1}` })),
    });
    yearEl.evaluate.mockResolvedValue({
      tag: 'input',
      name: 'yyyy',
      attrs: {},
      options: [],
    });

    locatorMock.all.mockResolvedValue([dayEl, monthEl, yearEl]);

    const date = new Date(2024, 2, 10); // March 10, 2024
    const result = await setDateGroup({ el: mock, tag: 'div', type: null }, date);

    expect(result).toBe(true);
    expect(monthEl.selectOption).toHaveBeenCalledWith({ index: 2 }, undefined);
  });

  it('throws error if fields cannot be detected', async () => {
    const { mock, locatorMock } = createMockLocator();
    const el1 = { evaluate: vi.fn(), fill: vi.fn() };
    const el2 = { evaluate: vi.fn(), fill: vi.fn() };

    el1.evaluate.mockResolvedValue({
      tag: 'input',
      name: 'unknown1',
      attrs: {},
      options: [],
    });
    el2.evaluate.mockResolvedValue({
      tag: 'input',
      name: 'unknown2',
      attrs: {},
      options: [],
    });

    locatorMock.all.mockResolvedValue([el1, el2]);

    const date = new Date();
    await expect(setDateGroup({ el: mock, tag: 'div', type: null }, date)).rejects.toThrow('Could not reliably detect date fields');
  });

  it('clears fields when value is null', async () => {
    const { mock, locatorMock } = createMockLocator();
    const dayEl = { evaluate: vi.fn(), fill: vi.fn() };
    const monthEl = { evaluate: vi.fn(), selectOption: vi.fn() };
    const yearEl = { evaluate: vi.fn(), fill: vi.fn() };

    dayEl.evaluate.mockResolvedValue({ tag: 'input' });
    monthEl.evaluate.mockResolvedValue({ tag: 'select' });
    yearEl.evaluate.mockResolvedValue({ tag: 'input' });

    locatorMock.all.mockResolvedValue([dayEl, monthEl, yearEl]);

    const result = await setDateGroup({ el: mock, tag: 'div', type: null }, null);

    expect(result).toBe(true);
    expect(dayEl.fill).toHaveBeenCalledWith('', undefined);
    expect(monthEl.selectOption).toHaveBeenCalledWith([], undefined);
    expect(yearEl.fill).toHaveBeenCalledWith('', undefined);
  });
});
