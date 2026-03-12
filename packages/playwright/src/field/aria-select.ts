import type { Loc, SetOptions, Value } from './types';

export async function selectAria({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'string' && typeof value !== 'number') return false;

  const role = await el.getAttribute('role', options).catch(() => null);
  if (role !== 'combobox') return false;

  const ariaControls = await el.getAttribute('aria-controls', options).catch(() => null);
  if (!ariaControls) return false;

  const ariaExpanded = await el.getAttribute('aria-expanded', options).catch(() => null);
  if (ariaExpanded !== 'true') await el.click(options);

  const stringValue = String(value);
  const listbox = el.page().locator(`#${ariaControls}`);

  // 1. By value attribute
  const byValue = listbox.locator(`[role="option"][value="${stringValue}"]`);
  if ((await byValue.count()) >= 1) {
    await byValue.first().click(options);
    return true;
  }

  // 2. By accessible name (case-insensitive)
  const byName = listbox.getByRole('option', { name: stringValue });
  if ((await byName.count()) >= 1) {
    await byName.first().click(options);
    return true;
  }

  return false;
}
