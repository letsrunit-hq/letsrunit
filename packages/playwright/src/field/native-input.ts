import type { Loc, SetOptions, Value } from './types';

export async function setNativeInput({ el, tag }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (tag !== 'input' && tag !== 'textarea') return false;

  if (value === null) {
    await el.clear(options);
    return true;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    await el.fill(String(value), options);
    return true;
  }

  return false;
}
