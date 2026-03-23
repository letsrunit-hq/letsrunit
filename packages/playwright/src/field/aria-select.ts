import type { Loc, SetOptions, Value } from './types';

function cssAttrEquals(name: string, value: string): string {
  return `[${name}=${JSON.stringify(value)}]`;
}

function caseInsensitiveExact(value: string): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

async function getControlledListbox({ el }: Loc, options?: SetOptions) {
  const ids: string[] = [];
  for (const attr of ['aria-controls', 'aria-owns']) {
    const raw = await el.getAttribute(attr, options).catch(/* v8 ignore next */ () => null);
    if (!raw) continue;
    ids.push(...raw.split(/\s+/).filter(Boolean));
  }

  for (const id of ids) {
    const listbox = el.page().locator(`[role="listbox"]${cssAttrEquals('id', id)}`).first();
    if ((await listbox.count()) > 0) return listbox;
  }

  return null;
}

async function getVisibleListbox({ el }: Loc, options?: SetOptions) {
  const listboxes = el.page().locator('[role="listbox"]:visible');
  await listboxes.first().waitFor({ state: 'visible', timeout: options?.timeout }).catch(() => null);
  if ((await listboxes.count()) > 0) return listboxes.first();
  return null;
}

export async function selectAria({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'string' && typeof value !== 'number') return false;

  const role = await el.getAttribute('role', options).catch(/* v8 ignore next */ () => null);
  if (role !== 'combobox') return false;

  let listbox = await getControlledListbox({ el }, options);

  const ariaExpanded = await el.getAttribute('aria-expanded', options).catch(/* v8 ignore next */ () => null);
  if (ariaExpanded !== 'true') {
    await el.click(options);
    listbox = listbox ?? (await getControlledListbox({ el }, options));
  }

  listbox = listbox ?? (await getVisibleListbox({ el }, options));
  if (!listbox) return false;

  const stringValue = String(value);

  // 1. By value attribute
  const byValue = listbox.locator(
    `[role="option"]${cssAttrEquals('value', stringValue)}, ` +
      `[role="option"]${cssAttrEquals('data-value', stringValue)}, ` +
      `[role="option"]${cssAttrEquals('ng-reflect-value', stringValue)}`,
  );
  if ((await byValue.count()) >= 1) {
    await byValue.first().click(options);
    return true;
  }

  // 2. By accessible name (case-insensitive)
  const byName = listbox.getByRole('option', { name: caseInsensitiveExact(stringValue) });
  if ((await byName.count()) >= 1) {
    await byName.first().click(options);
    return true;
  }

  return false;
}
