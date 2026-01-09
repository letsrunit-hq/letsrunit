import type { Locator } from '@playwright/test';
import * as assert from 'node:assert';
import { describe, expect, it, type Mocked, vi } from 'vitest';
import { setCalendarDate } from '../../src/field/calendar';

describe('setCalendarDate', () => {
  const createMockLocator = (props: any = {}) => {
    const mock = {
      locator: vi.fn(),
      first: vi.fn(),
      last: vi.fn(),
      nth: vi.fn(),
      or: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      getAttribute: vi.fn().mockResolvedValue(null),
      innerText: vi.fn().mockResolvedValue(''),
      allTextContents: vi.fn().mockResolvedValue([]),
      allInnerTexts: vi.fn().mockResolvedValue([]),
      click: vi.fn().mockResolvedValue(undefined),
      blur: vi.fn().mockResolvedValue(undefined),
      isVisible: vi.fn().mockResolvedValue(false),
      page: vi.fn().mockReturnValue({
        locator: vi.fn().mockReturnValue({
          getAttribute: vi.fn().mockResolvedValue('en'),
        }),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
      }),
      ...props,
    } as any;

    mock.locator.mockImplementation((_selector: string) => {
      return mock;
    });
    mock.first.mockReturnValue(mock);
    mock.last.mockReturnValue(mock);
    mock.nth.mockReturnValue(mock);
    mock.or.mockReturnValue(mock);

    return mock as unknown as Mocked<Locator>;
  };

  it('returns false if value is not a Date', async () => {
    const el = createMockLocator();
    const result = await setCalendarDate({ el } as any, '2024-01-01' as any);
    expect(result).toBe(false);
  });

  it('returns false if element is not a calendar', async () => {
    const el = createMockLocator();
    const result = await setCalendarDate({ el } as any, new Date());
    expect(result).toBe(false);
  });

  it('identifies and sets date on a basic calendar', async () => {
    const dayCell = createMockLocator({ isVisible: vi.fn().mockResolvedValue(true) });
    const cells = createMockLocator({
      count: vi.fn().mockResolvedValue(31),
      allTextContents: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
      allInnerTexts: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
    });

    const table = createMockLocator({
      count: vi.fn().mockResolvedValue(1),
      isVisible: vi.fn().mockResolvedValue(true),
    });

    table.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'td, [role="gridcell"]') return cells;
      if (selector.includes('aria-label')) return dayCell;
      return table;
    });

    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('January 2024'),
    });

    el.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'table[role="grid"]' || selector === 'table') return table;
      return el;
    });

    const result = await setCalendarDate({ el, tag: 'input' } as any, new Date('2024-01-15'));
    expect(result).toBe(true);
    expect(dayCell.click).toHaveBeenCalled();
    expect(el.blur).toHaveBeenCalled();
  });

  it('handles datepicker using aria-controls', async () => {
    const dayCell = createMockLocator({ isVisible: vi.fn().mockResolvedValue(true) });
    const cells = createMockLocator({
      count: vi.fn().mockResolvedValue(0), // Initially 0
      allTextContents: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
      allInnerTexts: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
    });

    const table = createMockLocator({
      count: vi.fn().mockResolvedValue(0), // Initially 0
      isVisible: vi.fn().mockResolvedValue(true),
    });

    table.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'td, [role="gridcell"]') return cells;
      if (selector.includes('aria-label')) return dayCell;
      return table;
    });

    const calendarDialog = createMockLocator({
      innerText: vi.fn().mockResolvedValue('July 2024'),
    });

    calendarDialog.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'table[role="grid"]' || selector === 'table') return table;
      return calendarDialog;
    });

    const el = createMockLocator({
      getAttribute: vi.fn().mockImplementation((attr: string) => {
        if (attr === 'role') return Promise.resolve('combobox');
        if (attr === 'aria-controls') return Promise.resolve('calendar-id');
        return Promise.resolve(null);
      }),
      count: vi.fn().mockResolvedValue(0),
    });

    el.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'table[role="grid"]' || selector === 'table') return table;
      return el;
    });

    el.page().locator = vi.fn().mockImplementation((selector: string) => {
      if (selector === '#calendar-id') return calendarDialog;
      return createMockLocator();
    });

    // When root.click() is called, the table should become available
    el.click.mockImplementation(async () => {
      table.count.mockResolvedValue(1);
      cells.count.mockResolvedValue(31);
      calendarDialog.count.mockResolvedValue(1);
    });

    const result = await setCalendarDate({ el } as any, new Date('2024-07-15'));
    expect(result).toBe(true);
    expect(dayCell.click).toHaveBeenCalled();
  });
});
