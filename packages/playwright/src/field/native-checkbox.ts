import type { Loc, SetOptions, Value } from './types';

export async function setNativeCheckbox({ el, tag, type }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'boolean' && value !== null) return false;
  if (tag === 'select' || tag === 'textarea' || tag === 'button') return false;

  let target = el;

  if (tag !== 'input' || type !== 'checkbox') {
    target = el.locator('input[type=checkbox]');
    if ((await target.count()) !== 1) return false;
  }

  if (value) {
    await target.check(options);
  } else {
    await target.uncheck(options);
  }

  return true;
}
