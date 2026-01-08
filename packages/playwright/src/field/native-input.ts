import type { Loc, SetOptions, Value } from './types';

export async function setNativeInput({ el, tag }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (tag !== 'input' && tag !== 'textarea') return false;
  if (typeof value !== 'string' && typeof value !== 'number') return false;

  await el.fill(String(value), options);

  return true;
}
