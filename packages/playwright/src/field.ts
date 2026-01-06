import { getWeekNumber } from '@letsrunit/utils';
import type { Locator } from '@playwright/test';

function formatDateForInput(date: Date, type: string | null): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());

  switch (type) {
    case 'number':
      return date.getTime().toString();
    case 'datetime-local':
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    case 'month':
      return `${yyyy}-${mm}`;
    case 'week': {
      const week = getWeekNumber(date);
      return `${yyyy}-W${pad(week)}`;
    }
    case 'time':
      return `${hh}:${min}`;
    case 'date':
    default:
      return `${yyyy}-${mm}-${dd}`;
  }
}

export async function setFieldValue(
  el: Locator,
  value: string | number | Date | boolean,
  options?: { force?: boolean; noWaitAfter?: boolean; timeout?: number },
): Promise<void> {
  const tagName = await el.evaluate((e) => e.tagName);

  if (tagName === 'SELECT') {
    const val = String(value);
    const result = await el.selectOption(val, options);

    if (result.length === 0) {
      throw new Error(`Option "${val}" not found in select`);
    }

    return;
  }

  if (typeof value === 'boolean') {
    if (value) {
      await el.check(options);
    } else {
      await el.uncheck(options);
    }
    return;
  }

  let val: string;
  if (value instanceof Date) {
    const type = await el.getAttribute('type', options).catch(() => null);
    val = formatDateForInput(value, type);
  } else {
    val = String(value);
  }

  await el.fill(val, options);
}
