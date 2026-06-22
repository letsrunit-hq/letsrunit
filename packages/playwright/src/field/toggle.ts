import type { Loc, SetOptions, Value } from './types';

async function getToggleTarget(el: Loc['el'], options?: SetOptions): Promise<Loc['el'] | null> {
  const role = await el.getAttribute('role', options).catch(
    /* v8 ignore next — attribute might be missing or element might have detached during the check */
    () => null,
  );
  if (role === 'checkbox' || role === 'switch') return el;

  const byRole = el.locator('[role="switch"], [role="checkbox"]').first();
  if ((await byRole.count()) > 0) return byRole;

  const byState = el.locator('[aria-checked]').first();
  if ((await byState.count()) > 0) return byState;

  return null;
}

async function readToggleState(target: Loc['el'], options?: SetOptions): Promise<boolean | null> {
  const ariaChecked = await target.getAttribute('aria-checked', options).catch(
    /* v8 ignore next — attribute might be missing or element might have detached during the check */
    () => null,
  );
  if (ariaChecked === 'true') return true;
  if (ariaChecked === 'false' || ariaChecked === null) return false;
  return null;
}

async function waitForToggleState(target: Loc['el'], desired: boolean, options?: SetOptions): Promise<boolean> {
  const timeout = Math.max(0, options?.timeout ?? 1000);
  const deadline = Date.now() + timeout;

  while (Date.now() <= deadline) {
    const state = await readToggleState(target, options);
    if (state === desired) return true;
    await target.page().waitForTimeout(25);
  }

  return (await readToggleState(target, options)) === desired;
}

export async function setToggle({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'boolean' && value !== null) return false;

  const target = await getToggleTarget(el, options);
  if (!target) return false;

  const isChecked = await readToggleState(target, options);
  if (isChecked === null) return false;

  if (Boolean(value) !== isChecked) await target.click(options);

  return waitForToggleState(target, Boolean(value), options);
}
