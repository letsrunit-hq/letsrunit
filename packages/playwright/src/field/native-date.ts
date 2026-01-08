import type { Loc, SetOptions, Value } from './types';
import { formatDateForInput } from './utils';

export async function setNativeDate({ el, tag, type }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (!(value instanceof Date)) return false;
  if (tag !== 'input' || !type || !['date', 'datetime-local', 'month', 'week', 'time'].includes(type)) return false;

  const val = formatDateForInput(value, type);
  await el.fill(val, options);

  return true;
}
