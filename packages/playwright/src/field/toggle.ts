import type { Loc, SetOptions, Value } from './types';

export async function setToggle({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'boolean' && value !== null) return false;

  const role = await el.getAttribute('role', options).catch(/* v8 ignore next */ () => null);
  if (role !== 'checkbox' && role !== 'switch') return false;

  const ariaChecked = await el.getAttribute('aria-checked', options).catch(/* v8 ignore next */ () => null);
  const isChecked = ariaChecked === 'true';

  if (Boolean(value) !== isChecked) await el.click(options);

  return true;
}
