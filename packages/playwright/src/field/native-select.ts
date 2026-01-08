import type { Loc, SetOptions, Value } from './types';

export async function selectNative({ el, tag }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (tag !== 'select') return false;

  const val = String(value);
  const result = await el.selectOption(val, options);

  if (result.length === 0) {
    throw new Error(`Option "${val}" not found in select`);
  }

  return true;
}
