import { chain } from '@letsrunit/utils';
import type { Locator } from '@playwright/test';
import type { Loc, SetOptions, Value } from './types';
import { formatDate, getMonthNames } from './utils';

export async function isCalendar(root: Locator): Promise<boolean> {
  const table = root.locator('table[role="grid"]').first().or(root.locator('table').first());

  if ((await table.count()) === 0) return false;

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

async function getCurrentMonthAndYear(root: Locator): Promise<{ month: number; year: number } | null> {
  const lang = await root
    .page()
    .locator('html')
    .getAttribute('lang')
    .catch(() => undefined);
  const locales = [lang, 'en-US'].filter(Boolean) as string[];

  const monthSets = locales.map(getMonthNames);
  const text = await root.innerText();

  const found = monthSets
    .flatMap((months) =>
      months.map((monthName, i) => {
        const regex = new RegExp(`(${monthName})\\s*(\\d{4})`, 'i');
        const match = text.match(regex);
        return match ? { month: i, year: parseInt(match[2], 10) } : null;
      }),
    )
    .find((m) => m !== null);

  if (found) return found;

  const foundMonth = monthSets
    .flatMap((months) => months.map((monthName, i) => (new RegExp(monthName, 'i').test(text) ? i : null)))
    .find((m) => m !== null);

  const yearMatch = text.match(/\b(20\d{2})\b/);
  const foundYear = yearMatch ? parseInt(yearMatch[1], 10) : null;

  return foundMonth && foundYear ? { month: foundMonth, year: foundYear } : null;
}

async function navigateToMonth(
  root: Locator,
  target: Date,
  options?: SetOptions & { wait?: number; retry?: number },
): Promise<boolean> {
  const current = await getCurrentMonthAndYear(root);
  if (!current) return false;

  const currentTotal = current.year * 12 + current.month;
  const targetTotal = target.getFullYear() * 12 + target.getMonth();
  const diff = targetTotal - currentTotal;

  if (diff === 0) return true;

  const btn =
    diff < 0
      ? root.locator('button[aria-label*="prev"], [class*="prev"]').first()
      : root.locator('button[aria-label*="next"], [class*="next"]').first();

  for (let i = 0; i < Math.abs(diff); i++) {
    await btn.click(options);
    await root.page().waitForTimeout(options?.wait ?? 50);
  }

  const after = await getCurrentMonthAndYear(root);
  if (after && after.year * 12 + after.month !== targetTotal) {
    if ((options?.retry ?? 0) >= 1) return false;
    // Sanity check failed. Try again once and slower this time
    return await navigateToMonth(root, target, { ...options, wait: 250, retry: 1 });
  }

  return true;
}

async function setDayByAriaLabel(table: Locator, value: Date, options?: SetOptions): Promise<boolean> {
  const formats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'];
  const candidateLabels = [value.toDateString(), ...formats.map((fmt) => formatDate(value, fmt))];

  const cells = (
    await Promise.all(
      candidateLabels.map(async (label) => {
        const cell = table.locator(`[aria-label="${label}"], [aria-label*="${label}"]`).first();
        return (await cell.isVisible()) ? cell : null;
      }),
    )
  ).filter((l) => l !== null);

  if (cells.length === 0) return false;

  // Typically we'd find 1 matching cell
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
      return (await cell.isVisible()) ? fmt : null;
    }),
  );

  const finalFormat = probeResults.find((fmt) => fmt !== null);
  const finalLabel = finalFormat ? formatDate(value, finalFormat) : null;
  const finalCell = finalLabel
    ? table.locator(`[aria-label="${finalLabel}"], [aria-label*="${finalLabel}"]`).first()
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

export async function setCalendarDate({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (!(value instanceof Date) || !(await isCalendar(el))) return false;

  await navigateToMonth(el, value, options);

  const table = el.locator('table[role="grid"]').first().or(el.locator('table').first());
  return chain(setDayByAriaLabel, setDayByByCellText)(table, value, options);
}
