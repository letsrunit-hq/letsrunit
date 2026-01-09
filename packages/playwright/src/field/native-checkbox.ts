import type { Loc, SetOptions, Value } from './types';

export async function setNativeCheckbox({ el, tag, type }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if ((typeof value !== 'boolean' && value !== null) || tag !== 'input' || type !== 'checkbox') return false;

  if (value) {
    await el.check(options);
  } else {
    await el.uncheck(options);
  }

  return true;
}
