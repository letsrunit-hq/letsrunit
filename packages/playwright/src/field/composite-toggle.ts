import type { Locator } from '@playwright/test';
import type { Loc, SetOptions, Value } from './types';

async function getToggleTarget(el: Locator, options?: SetOptions): Promise<Locator | null> {
  const candidates = el.locator('button, [role="button"], [role="switch"], [role="checkbox"], [aria-checked], [tabindex]');
  if ((await candidates.count()) === 0) return null;

  const visible = candidates.filter({ visible: true });
  if ((await visible.count()) > 0) return visible.first();

  return candidates.first();
}

async function readToggleState(target: Locator, options?: SetOptions): Promise<boolean | null> {
  const ariaChecked = await target.getAttribute('aria-checked', options).catch(() => null);
  if (ariaChecked === 'true') return true;
  if (ariaChecked === 'false') return false;

  const checked = await target.getAttribute('checked', options).catch(() => null);
  if (checked !== null) return checked !== 'false';

  const className = await target.getAttribute('class', options).catch(() => null);
  if (className) {
    const lower = className.toLowerCase();
    if (/(^|\s|-)checked(\s|$|-)/.test(lower)) return true;
    if (/(^|\s|-)unchecked(\s|$|-)/.test(lower)) return false;
    if (/switch/.test(lower)) return /checked/.test(lower);
  }

  return null;
}

export async function setCompositeToggle({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'boolean' && value !== null) return false;

  const target = await getToggleTarget(el, options);
  if (!target) return false;

  const initial = await readToggleState(target, options);
  if (initial === null) return false;

  const desired = Boolean(value);
  if (initial !== desired) {
    await target.click(options);
  }

  const next = await readToggleState(target, options);
  return next === desired;
}
