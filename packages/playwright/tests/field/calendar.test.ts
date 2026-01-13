import type { Locator } from '@playwright/test';
import * as assert from 'node:assert';
import { describe, expect, it, type Mocked, vi } from 'vitest';
import { getCurrentMonthsAndYears, setCalendarDate } from '../../src/field/calendar';

describe('setCalendarDate', () => {
  const createMockLocator = (props: any = {}) => {
    const mock = {
      locator: vi.fn(),
      first: vi.fn(),
      last: vi.fn(),
      nth: vi.fn(),
      or: vi.fn(),
      filter: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      getAttribute: vi.fn().mockResolvedValue(null),
      innerText: vi.fn().mockResolvedValue(''),
      allTextContents: vi.fn().mockResolvedValue([]),
      allInnerTexts: vi.fn().mockResolvedValue([]),
      click: vi.fn().mockResolvedValue(undefined),
      blur: vi.fn().mockResolvedValue(undefined),
      isVisible: vi.fn().mockResolvedValue(false),
      evaluate: vi.fn().mockResolvedValue(''),
      evaluateHandle: vi.fn().mockResolvedValue({}),
      elementHandle: vi.fn().mockResolvedValue({}),
      all: vi.fn().mockResolvedValue([]),
      page: vi.fn().mockReturnValue({
        locator: vi.fn().mockReturnValue({
          getAttribute: vi.fn().mockResolvedValue('en'),
        }),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
        waitForLoadState: vi.fn().mockResolvedValue(undefined),
        url: vi.fn().mockReturnValue('http://localhost'),
        keyboard: {
          press: vi.fn().mockResolvedValue(undefined),
        },
      }),
      ...props,
    } as any;

    mock.locator.mockImplementation((_selector: string) => {
      return mock;
    });
    mock.first.mockReturnValue(mock);
    mock.last.mockReturnValue(mock);
    mock.nth.mockReturnValue(mock);
    mock.filter.mockReturnValue(mock);
    mock.all.mockResolvedValue([mock]);
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
    const tableCells = createMockLocator({
      count: vi.fn().mockResolvedValue(31),
      allTextContents: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
      allInnerTexts: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
    });

    const table = createMockLocator({
      count: vi.fn().mockResolvedValue(1),
      isVisible: vi.fn().mockResolvedValue(true),
      evaluate: vi.fn().mockResolvedValue('TABLE'),
    });
    table.all.mockResolvedValue([table]);

    table.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'td, [role="gridcell"]') return tableCells;
      if (selector.includes('aria-label')) return dayCell;
      return table;
    });

    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('January 2024'),
      evaluate: vi.fn().mockResolvedValue('INPUT'),
    });

    el.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'table, [role="grid"]') return table;
      return el;
    });

    const result = await setCalendarDate({ el, tag: 'input' } as any, new Date('2024-01-15'));
    expect(result).toBe(true);
    expect(dayCell.click).toHaveBeenCalled();
    expect(el.blur).toHaveBeenCalled();
  });

  it('handles datepicker using aria-controls', async () => {
    const dayCell = createMockLocator({ isVisible: vi.fn().mockResolvedValue(true) });
    const tableCells = createMockLocator({
      count: vi.fn().mockResolvedValue(0), // Initially 0
      allTextContents: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
      allInnerTexts: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
    });

    const table = createMockLocator({
      count: vi.fn().mockResolvedValue(0), // Initially 0
      isVisible: vi.fn().mockResolvedValue(true),
      evaluate: vi.fn().mockResolvedValue('TABLE'),
    });
    table.all.mockResolvedValue([table]);

    table.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'td, [role="gridcell"]') return tableCells;
      if (selector.includes('aria-label')) return dayCell;
      return table;
    });

    const calendarDialog = createMockLocator({
      innerText: vi.fn().mockResolvedValue('July 2024'),
    });

    calendarDialog.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'table, [role="grid"]') return table;
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
      if (selector === 'table, [role="grid"]') return table;
      return el;
    });

    el.page().locator = vi.fn().mockImplementation((selector: string) => {
      if (selector === '#calendar-id') return calendarDialog;
      return createMockLocator();
    });

    // When root.click() is called, the table should become available
    el.click.mockImplementation(async () => {
      table.count.mockResolvedValue(1);
      tableCells.count.mockResolvedValue(31);
      calendarDialog.count.mockResolvedValue(1);
    });

    const result = await setCalendarDate({ el } as any, new Date('2024-07-15'));
    expect(result).toBe(true);
    expect(dayCell.click).toHaveBeenCalled();
  });

  it('handles multiple dates', async () => {
    const dayCell = createMockLocator({ isVisible: vi.fn().mockResolvedValue(true) });

    const table = createMockLocator({
      count: vi.fn().mockResolvedValue(1),
      isVisible: vi.fn().mockResolvedValue(true),
      evaluate: vi.fn().mockResolvedValue('TABLE'),
    });
    table.all.mockResolvedValue([table]);

    const tableCells = createMockLocator({
      count: vi.fn().mockResolvedValue(31),
      allTextContents: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
      allInnerTexts: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
    });

    table.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'td, [role="gridcell"]') return tableCells;
      if (selector.includes('aria-label')) return dayCell;
      return table;
    });

    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('July 2024'),
    });

    el.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'table, [role="grid"]') return table;
      return el;
    });

    const dates = [new Date('2024-07-15'), new Date('2024-07-18')];
    const result = await setCalendarDate({ el } as any, dates);
    expect(result).toBe(true);
    expect(dayCell.click).toHaveBeenCalledTimes(2);
  });

  it('handles date ranges', async () => {
    const dayCell = createMockLocator({ isVisible: vi.fn().mockResolvedValue(true) });

    const table = createMockLocator({
      count: vi.fn().mockResolvedValue(1),
      isVisible: vi.fn().mockResolvedValue(true),
      evaluate: vi.fn().mockResolvedValue('TABLE'),
    });
    table.all.mockResolvedValue([table]);

    const tableCells = createMockLocator({
      count: vi.fn().mockResolvedValue(31),
      allTextContents: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
      allInnerTexts: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
    });

    table.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'td, [role="gridcell"]') return tableCells;
      if (selector.includes('aria-label')) return dayCell;
      return table;
    });

    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('July 2024'),
    });

    el.locator.mockImplementation((selector) => {
      assert.equal(typeof selector, 'string');
      if (selector === 'table, [role="grid"]') return table;
      return el;
    });

    const range = { from: new Date('2024-07-15'), to: new Date('2024-07-18') };
    const result = await setCalendarDate({ el } as any, range);
    expect(result).toBe(true);
    expect(dayCell.click).toHaveBeenCalledTimes(2);
  });

  it('handles multi-month range across tables and navigation', async () => {
    // Start with Jan and Feb 2024
    // Target range: Feb 15 to March 10
    // Feb is already visible in the second table.
    // March is not visible, need to click "next".
    // After next, tables should be Feb and March.

    const dayCell = createMockLocator({ isVisible: vi.fn().mockResolvedValue(true) });

    const table1 = createMockLocator({
      count: vi.fn().mockResolvedValue(1),
      isVisible: vi.fn().mockResolvedValue(true),
      evaluate: vi.fn().mockResolvedValue('TABLE'),
    });
    const table2 = createMockLocator({
      count: vi.fn().mockResolvedValue(1),
      isVisible: vi.fn().mockResolvedValue(true),
      evaluate: vi.fn().mockResolvedValue('TABLE'),
    });

    const tables = [table1, table2];
    table1.all.mockResolvedValue(tables);
    table2.all.mockResolvedValue(tables);

    const setupTableMock = (table: any) => {
      const tableCells = createMockLocator({
        count: vi.fn().mockResolvedValue(31),
        allTextContents: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
        allInnerTexts: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
      });
      table.locator.mockImplementation((selector: string) => {
        if (selector === 'td, [role="gridcell"]') return tableCells;
        if (selector.includes('aria-label')) return dayCell;
        return table;
      });
    };
    setupTableMock(table1);
    setupTableMock(table2);

    const nextBtn = createMockLocator({ isVisible: vi.fn().mockResolvedValue(true) });
    nextBtn.count.mockResolvedValue(1);
    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('January 2024 February 2024'),
    });

    el.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'table, [role="grid"]') return table1;
      if (selector.includes('next')) return nextBtn;
      return el;
    });

    // Mock navigation: when next is clicked, update el innerText
    nextBtn.click.mockImplementation(async () => {
      el.innerText.mockResolvedValue('February 2024 March 2024');
      nextBtn.count.mockResolvedValue(1); // Keep it visible for simplicity if needed
    });

    const range = { from: new Date('2024-02-15'), to: new Date('2024-03-10') };
    const result = await setCalendarDate({ el, tag: 'div' } as any, range);

    expect(result).toBe(true);

    expect(nextBtn.click).toHaveBeenCalledTimes(2);
    expect(dayCell.click).toHaveBeenCalledTimes(2);
  });

  it('handles MUI DateCalendar (div[role="grid"])', async () => {
    const dayCell = createMockLocator({ isVisible: vi.fn().mockResolvedValue(true) });
    const cells = createMockLocator({
      count: vi.fn().mockResolvedValue(31),
      allTextContents: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
      allInnerTexts: vi.fn().mockResolvedValue(Array.from({ length: 31 }, (_, i) => String(i + 1))),
    });

    const grid = createMockLocator({
      count: vi.fn().mockResolvedValue(1),
      isVisible: vi.fn().mockResolvedValue(true),
      getAttribute: vi.fn().mockImplementation((attr: string) => {
        if (attr === 'role') return Promise.resolve('grid');
        return Promise.resolve(null);
      }),
      evaluate: vi.fn().mockResolvedValue('DIV'),
    });
    grid.all.mockResolvedValue([grid]);

    grid.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'td, [role="gridcell"]') return cells;
      if (selector.includes('aria-label')) return dayCell;
      return grid;
    });

    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('January 2024'),
      evaluate: vi.fn().mockResolvedValue('DIV'),
    });

    el.locator.mockImplementation((selector) => {
      assert.ok(typeof selector === 'string');
      if (selector === 'table, [role="grid"]') return grid;
      // These are used in getCalendar
      if (selector === 'table') return createMockLocator({ count: vi.fn().mockResolvedValue(0) });
      return el;
    });

    const result = await setCalendarDate({ el, tag: 'div' } as any, new Date('2024-01-15'));
    expect(result).toBe(true);
    expect(dayCell.click).toHaveBeenCalled();
  });
});

describe('getCurrentMonthsAndYears', () => {
  const date = new Date('2024-02-15');
  const createMockLocator = (props: any = {}) => {
    const mock = {
      getAttribute: vi.fn().mockResolvedValue(null),
      innerText: vi.fn().mockResolvedValue(''),
      page: vi.fn().mockReturnValue({
        locator: vi.fn().mockReturnValue({
          getAttribute: vi.fn().mockResolvedValue('en'),
        }),
      }),
      ...props,
    } as any;

    return mock as unknown as Mocked<Locator>;
  };

  it('identifies month and year from pairs (normal case)', async () => {
    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('January 2024'),
    });
    const result = await getCurrentMonthsAndYears(el, date);
    expect(result).toEqual([{ month: 0, year: 2024 }]);
  });

  it('identifies multiple month and year pairs', async () => {
    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('December 2023 January 2024'),
    });
    const result = await getCurrentMonthsAndYears(el, date);
    expect(result).toEqual([
      { month: 11, year: 2023 },
      { month: 0, year: 2024 },
    ]);
  });

  it('fallback: 1 year found with months (break pair regex)', async () => {
    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('January [some-other-text] 2024'),
    });
    const result = await getCurrentMonthsAndYears(el, date);
    expect(result).toEqual([{ month: 0, year: 2024 }]);
  });

  it('fallback: 2 years found with months (heuristic)', async () => {
    // months >= July (6) -> year[0], months <= June (5) -> year[1]
    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('2023 2024\nDecember January February'),
    });
    const result = await getCurrentMonthsAndYears(el, date);
    expect(result).toEqual([
      { month: 11, year: 2023 },
      { month: 0, year: 2024 },
      { month: 1, year: 2024 },
    ]);
  });

  it('fallback: multiple months with 1 year', async () => {
    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('May and June of 2024'),
    });
    const result = await getCurrentMonthsAndYears(el, date);
    expect(result).toEqual([
      { month: 4, year: 2024 },
      { month: 5, year: 2024 },
    ]);
  });

  it('fallback: no years found', async () => {
    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('December January February'),
    });
    const result = await getCurrentMonthsAndYears(el, date);
    expect(result).toEqual([
      { month: 11, year: 2023 },
      { month: 0, year: 2024 },
      { month: 1, year: 2024 },
    ]);
  });

  it('returns empty if no months found', async () => {
    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('Just some text 2024'),
    });
    const result = await getCurrentMonthsAndYears(el, date);
    expect(result).toEqual([]);
  });

  it('handles other locales (e.g. French)', async () => {
    const el = createMockLocator({
      innerText: vi.fn().mockResolvedValue('Janvier 2024'),
      page: vi.fn().mockReturnValue({
        locator: vi.fn().mockReturnValue({
          getAttribute: vi.fn().mockResolvedValue('fr'),
        }),
      }),
    });
    const result = await getCurrentMonthsAndYears(el, date);
    expect(result).toEqual([{ month: 0, year: 2024 }]);
  });
});
