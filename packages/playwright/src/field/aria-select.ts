import type { Loc, SetOptions, Value } from './types';

function cssAttrEquals(name: string, value: string): string {
  return `[${name}=${JSON.stringify(value)}]`;
}

function caseInsensitiveExact(value: string): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

async function getComboboxRoot(el: Loc['el'], options?: SetOptions) {
  const role = await el.getAttribute('role', options).catch(/* v8 ignore next */ () => null);
  if (role === 'combobox') return el;

  const byRole = el.locator('[role="combobox"]').first();
  if ((await byRole.count()) > 0) return byRole;

  const popupInput = el
    .locator('input[aria-controls], input[aria-owns], input[aria-haspopup], textarea[aria-controls], textarea[aria-owns], textarea[aria-haspopup]')
    .first();
  if ((await popupInput.count()) > 0) return popupInput;

  return null;
}

async function getControlledListbox(el: Loc['el'], options?: SetOptions) {
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

async function getVisibleListbox(el: Loc['el'], options?: SetOptions) {
  const listboxes = el.page().locator('[role="listbox"]:visible');
  await listboxes.first().waitFor({ state: 'visible', timeout: options?.timeout }).catch(() => null);
  if ((await listboxes.count()) > 0) return listboxes.first();
  return null;
}

async function didSelectionApply(
  root: Loc['el'],
  option: Loc['el'],
  before: string | null,
  options?: SetOptions,
): Promise<boolean> {
  const ariaSelected = await option.getAttribute('aria-selected', options).catch(() => null);
  if (ariaSelected === 'true') return true;

  const optionId = await option.getAttribute('id', options).catch(() => null);
  const activeDescendant = await root.getAttribute('aria-activedescendant', options).catch(() => null);
  if (optionId && activeDescendant === optionId) return true;

  const after = await root
    .evaluate((node) => {
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        return node.value;
      }
      return node.textContent?.trim() ?? '';
    }, options)
    .catch(() => null);

  if (before !== null && after !== null && after !== before) return true;

  const listbox = await getVisibleListbox(root, options);
  if (!listbox) return true;

  return false;
}

export async function selectAria({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'string' && typeof value !== 'number') return false;

  const root = await getComboboxRoot(el, options);
  if (!root) return false;

  let listbox = await getControlledListbox(root, options);

  const ariaExpanded = await root.getAttribute('aria-expanded', options).catch(/* v8 ignore next */ () => null);
  if (ariaExpanded !== 'true') {
    await root.click(options);
    listbox = listbox ?? (await getControlledListbox(root, options));
  }

  listbox = listbox ?? (await getVisibleListbox(root, options));
  if (!listbox) return false;

  const stringValue = String(value);
  const before = await root
    .evaluate((node) => {
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        return node.value;
      }
      return node.textContent?.trim() ?? '';
    }, options)
    .catch(() => null);

  // 1. By value attribute
  const byValue = listbox.locator(
    `[role="option"]${cssAttrEquals('value', stringValue)}, ` +
      `[role="option"]${cssAttrEquals('data-value', stringValue)}, ` +
      `[role="option"]${cssAttrEquals('ng-reflect-value', stringValue)}`,
  );
  if ((await byValue.count()) >= 1) {
    const option = byValue.first();
    await option.click(options);
    return await didSelectionApply(root, option, before, options);
  }

  // 2. By accessible name (case-insensitive)
  const byName = listbox.getByRole('option', { name: caseInsensitiveExact(stringValue) });
  if ((await byName.count()) >= 1) {
    const option = byName.first();
    await option.click(options);
    return await didSelectionApply(root, option, before, options);
  }

  return false;
}
