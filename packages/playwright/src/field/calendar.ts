import { isArray, isDate, isRange } from '@letsrunit/utils';
import { uniqueItem } from '@letsrunit/utils/src/array';
import type { Locator } from '@playwright/test';
import type { Loc, SetOptions, Value } from './types';
import { formatDate, formatDateForInput, getMonthNames } from './utils';

type MonthYear = { month: number; year: number };

async function getDialog(root: Locator, options?: SetOptions) {
  const role = await root.getAttribute('role', options).catch(() => null);

  if (role !== 'combobox') return null;

  const ariaControls = await root.getAttribute('aria-controls', options).catch(() => null);
  if (!ariaControls) return null;

  const calendar = root.page().locator(`#${ariaControls}`);
  if ((await calendar.count()) === 0) {
    await root.click(options);
  }

  const count = await calendar.count();
  return count > 0 ? calendar : null;
}

async function isCalendarTable(table: Locator): Promise<boolean> {
  const cells = table.locator('td, [role="gridcell"]');
  const cellCount = await cells.count();
  if (cellCount < 28 || cellCount > 80) return false; // Sanity check

  const texts = await cells.allTextContents();
  const days = texts
    .map((t) => t.trim())
    .filter((t) => /^\d{1,2}$/.test(t))
    .map(Number)
    .filter((n) => n >= 1 && n <= 31);

  // Expect sequential numbering from 1 to at least 28. Ignore other cells with other content.
  const last = days.reduce((max, cur) => (cur === max + 1 ? cur : max), 0);
  return last >= 28;
}

export async function getCalendar(
  root: Locator,
  options?: SetOptions,
): Promise<{ calendar: Locator; tables: Locator[] } | null> {
  const calendar = (await root.locator('table').count()) > 0 ? root : await getDialog(root, options);
  if (!calendar) return null;

  const allTables = await calendar.locator('table').all();
  const tables = allTables.filter(isCalendarTable);

  return tables.length > 0 ? { calendar, tables } : null;
}

function uniqueMonthYearPairs(pairs: MonthYear[]): MonthYear[] {
  const map = pairs.reduce(
    (acc, r) => acc.set(`${r.year}-${r.month}`, r),
    new Map<string, { month: number; year: number }>(),
  );
  return Array.from(map.values());
}

function inferYearForMonth(target: Date, month: number): number {
  const ty = target.getFullYear();
  const tm = target.getMonth();
  const targetTotal = ty * 12 + tm;

  const candidates = [ty - 1, ty, ty + 1].map((y) => ({ year: y, total: y * 12 + month }));
  candidates.sort((a, b) => Math.abs(a.total - targetTotal) - Math.abs(b.total - targetTotal));
  return candidates[0].year;
}

export async function getCurrentMonthsAndYears(root: Locator, target: Date): Promise<MonthYear[]> {
  const lang = await root
    .page()
    .locator('html')
    .getAttribute('lang')
    .catch(() => undefined);
  const locales = lang && !lang.startsWith('en') ? [lang, 'en-US'] : ['en-US'];

  const text = await root.innerText();
  const monthSets = locales.map(getMonthNames);

  // Look for month year pairs
  const pairs = monthSets.flatMap((months) => {
    const matches = text.matchAll(new RegExp(`(${months.join('|')})\\W*(\\d{4})`, 'gi'));
    return Array.from(matches)
      .map((m) => ({
        month: months.findIndex((x) => x.toLowerCase() === m[1].toLowerCase()),
        year: Number.parseInt(m[2], 10),
      }))
      .filter((r) => r.month !== -1);
  });

  if (pairs.length) {
    return uniqueMonthYearPairs(pairs);
  }

  // Fallback looking for months only
  const months = monthSets
    .flatMap((ms) => ms.map((name, i) => (new RegExp(name, 'i').test(text) ? i : -1)))
    .filter(uniqueItem)
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);

  const years = (text.match(/\b20\d{2}\b/g) ?? [])
    .map((y) => Number.parseInt(y, 10))
    .filter(uniqueItem)
    .sort((a, b) => a - b);

  if (!months.length) return [];

  if (years.length === 1) {
    return months.map((month) => ({ month, year: years[0] }));
  }

  // Heuristic: months >= July belong to y0 and <= June belongs to y1
  if (years.length === 2) {
    return months
      .map((month) => ({ month, year: month >= 6 ? years[0] : years[1] }))
      .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  }

  // Year can't be determined, infer from target date
  return months
    .map((month) => ({ month, year: inferYearForMonth(target, month) }))
    .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
}

async function navigateToMonth(
  root: Locator,
  target: Date,
  options?: SetOptions & { wait?: number; retry?: number },
): Promise<boolean> {
  const currentMonths = await getCurrentMonthsAndYears(root, target);
  if (currentMonths.length === 0) return false;

  const targetTotal = target.getFullYear() * 12 + target.getMonth();
  if (currentMonths.find((m) => m.year * 12 + m.month === targetTotal)) {
    return true;
  }

  const firstMonthTotal = currentMonths[0].year * 12 + currentMonths[0].month;
  const diff = targetTotal - firstMonthTotal;

  const btn =
    diff < 0
      ? root.locator('button[aria-label*="prev"], button[class*="prev"]').filter({ visible: true }).first()
      : root.locator('button[aria-label*="next"], button[class*="next"]').filter({ visible: true }).first();

  if (!(await btn.count())) return false;

  for (let i = 0; i < Math.abs(diff); i++) {
    await btn.click(options);
    await root.page().waitForTimeout(options?.wait ?? 50);
  }

  const afterMonths = await getCurrentMonthsAndYears(root, target);
  if (afterMonths.some((m) => m.year * 12 + m.month === targetTotal)) return true;

  if ((options?.retry ?? 0) >= 3) return false;
  return await navigateToMonth(root, target, { ...options, wait: 100, retry: (options?.retry ?? 0) + 1 });
}

async function setDayByAriaLabel(table: Locator, value: Date, options?: SetOptions): Promise<boolean> {
  const formats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'];
  const candidateLabels = [value.toDateString(), ...formats.map((fmt) => formatDate(value, fmt))];

  const cells = (
    await Promise.all(
      candidateLabels.map(async (label) => {
        const cell = table.locator(`[aria-label="${label}"], [aria-label*="${label}"]`).first();
        return (await cell.isVisible(options)) ? cell : null;
      }),
    )
  ).filter((l): l is Locator => l !== null);

  if (cells.length === 0) return false;

  if (cells.length === 1) {
    await cells[0].click(options);
    return true;
  }

  // Disambiguate using day 22 in case of dd/mm/yyyy vs mm/dd/yyyy
  const probeDate = new Date(value.getFullYear(), value.getMonth(), 22);
  const probeResults = await Promise.all(
    formats.map(async (fmt) => {
      const label = formatDate(probeDate, fmt);
      const cell = table.locator(`[aria-label="${label}"], [aria-label*="${label}"]`).first();
      return (await cell.isVisible(options)) ? fmt : null;
    }),
  );

  const finalFormat = probeResults.find((fmt) => fmt !== null);
  const finalCell = finalFormat
    ? table
        .locator(`[aria-label="${formatDate(value, finalFormat)}"], [aria-label*="${formatDate(value, finalFormat)}"]`)
        .first()
    : cells[0];

  await finalCell.click(options);
  return true;
}

async function setDayByByCellText(table: Locator, value: Date, options?: SetOptions): Promise<boolean> {
  const day = value.getDate();
  const cells = table.locator('td, [role="gridcell"]');

  const allTexts = await cells.allInnerTexts();
  const foundIndices = allTexts.map((text, i) => (text.trim() === String(day) ? i : -1)).filter((i) => i !== -1);

  if (foundIndices.length === 0) return false;

  const index = foundIndices.length === 1 || day < 15 ? foundIndices[0] : foundIndices[foundIndices.length - 1];
  await cells.nth(index).click(options);

  return true;
}

async function setDates(
  calendar: Locator,
  tables: Locator[],
  dates: Date[],
  options?: SetOptions,
): Promise<void> {

  let method: 'aria' | 'text' | undefined = undefined;

  for (const date of dates) {
    if (!(await navigateToMonth(calendar, date, options))) {
      throw new Error(`Failed to navigate to "${formatDateForInput(date, 'month')}"`);
    }

    const currentMonths = await getCurrentMonthsAndYears(calendar, date);
    const targetTotal = date.getFullYear() * 12 + date.getMonth();
    const tableIndex = currentMonths.findIndex((m) => m.year * 12 + m.month === targetTotal);
    const table = tables[tableIndex] ?? tables[0];

    if (method !== 'text' && (await setDayByAriaLabel(table, date, options))) {
      method ??= 'aria';
      continue;
    }

    if (method !== 'aria' && (await setDayByByCellText(table, date, options))) {
      method ??= 'text';
      continue;
    }

    throw new Error(`Failed to set date "${formatDateForInput(date, 'date')}"`)
  }
}

export async function setCalendarDate({ el, tag }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (!(value instanceof Date) && !isArray(value, isDate) && !isRange(value, isDate)) return false;

  const dates = isArray(value, isDate) ? value : isRange(value) ? [value.from, value.to] : [value];

  const { calendar, tables } = (await getCalendar(el, options)) ?? {};
  if (!calendar || !tables || tables.length === 0) return false;

  try {
    await setDates(calendar, tables, dates, options);
  } finally {
    // Close the dialog
    if (tag === 'input') {
      await el.page().keyboard.press('Escape').catch();
      await el.blur().catch();
    }
  }

  return true;
}
