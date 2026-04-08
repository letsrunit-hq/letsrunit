import type { Loc, SetOptions, Value } from './types';

async function getToggleTarget(el: Loc['el'], options?: SetOptions): Promise<Loc['el'] | null> {
  const role = await el.getAttribute('role', options).catch(/* v8 ignore next */ () => null);
  if (role === 'checkbox' || role === 'switch') return el;

  const byRole = el.locator('[role="switch"], [role="checkbox"]').first();
  if ((await byRole.count()) > 0) return byRole;

  const byState = el.locator('[aria-checked]').first();
  if ((await byState.count()) > 0) return byState;

  return null;
}

export async function setToggle({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'boolean' && value !== null) return false;

  const target = await getToggleTarget(el, options);
  if (!target) return false;

  const ariaChecked = await target.getAttribute('aria-checked', options).catch(/* v8 ignore next */ () => null);
  const isChecked = ariaChecked === 'true';

  if (Boolean(value) !== isChecked) await target.click(options);

  const nextAriaChecked = await target.getAttribute('aria-checked', options).catch(/* v8 ignore next */ () => null);
  return nextAriaChecked === String(Boolean(value));
}
