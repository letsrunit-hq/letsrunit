import { isDate, isRange, type Range } from '@letsrunit/utils';
import { formatDateForInput } from '../utils/date';
import type { Loc, SetOptions, Value } from './types';

async function setSingleDate({ el, tag, type }: Loc, value: Date, options?: SetOptions): Promise<boolean> {
  if (tag !== 'input' || !type || !['date', 'datetime-local', 'month', 'week', 'time'].includes(type)) return false;

  const val = formatDateForInput(value, type);
  await el.fill(val, options);

  return true;
}

async function setDateRange({ el, tag }: Loc, value: Range<Date>, options?: SetOptions): Promise<boolean> {
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button') return false;

  const inputs = el.locator('input[type=date]');
  if ((await inputs.count()) !== 2) return false;

  const from = formatDateForInput(value.from, 'date');
  const to = formatDateForInput(value.to, 'date');

  await inputs.nth(0).fill(from, options);
  await inputs.nth(1).fill(to, options);

  return true;
}

export async function setNativeDate(loc: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (value instanceof Date) {
    return await setSingleDate(loc, value, options);
  }

  if (isRange(value, isDate)) {
    return await setDateRange(loc, value, options);
  }

  return false;
}
