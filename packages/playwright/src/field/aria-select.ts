import type { Loc, SetOptions, Value } from './types';

function cssAttrEquals(name: string, value: string): string {
  return `[${name}=${JSON.stringify(value)}]`;
}

function caseInsensitiveExact(value: string): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

async function getComboboxRoot(el: Loc['el'], options?: SetOptions) {
  const role = await el.getAttribute('role', options).catch(
    /* v8 ignore next — attribute might be missing or element might have detached during the check */
    () => null,
  );
  if (role === 'combobox') return el;

  const byRole = el.locator('[role="combobox"]').first();
  if ((await byRole.count()) > 0) return byRole;

  const popupInput = el
    .locator('input[aria-controls], input[aria-owns], input[aria-haspopup], textarea[aria-controls], textarea[aria-owns], textarea[aria-haspopup]')
    .first();
  if ((await popupInput.count()) > 0) return popupInput;

  return null;
}

async function getComboboxTrigger(el: Loc['el']): Promise<Loc['el'] | null> {
  const trigger = el
    .locator(
      [
        '.mat-mdc-select-trigger',
        '[aria-haspopup="listbox"]',
        'button[aria-haspopup]',
        '[role="button"]',
      ].join(', '),
    )
    .first();
  if ((await trigger.count()) > 0) return trigger;
  return null;
}

async function getControlledListbox(el: Loc['el'], options?: SetOptions) {
  const ids: string[] = [];
  for (const attr of ['aria-controls', 'aria-owns']) {
    const raw = await el.getAttribute(attr, options).catch(
      /* v8 ignore next — attribute might be missing or element might have detached during the check */
      () => null,
    );
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

async function getRootValueText(root: Loc['el'], options?: SetOptions): Promise<string | null> {
  const valueNode = root
    .locator(
      [
        '.mat-mdc-select-value',
        '.mat-mdc-select-value-text',
        '[class*="select-value"]',
        '[class*="select-trigger"]',
      ].join(', '),
    )
    .first();
  if ((await valueNode.count()) > 0) {
    const valueText = await valueNode.textContent(options).catch(() => null);
    if (valueText !== null) return valueText.replace(/\s+/g, ' ').trim();
  }

  const ariaValueText = await root.getAttribute('aria-valuetext', options).catch(() => null);
  if (ariaValueText) return ariaValueText.trim();

  return root
    .evaluate((node) => {
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        return node.value;
      }
      return node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    }, options)
    .catch(() => null);
}

async function openCombobox(root: Loc['el'], options?: SetOptions): Promise<void> {
  const trigger = await getComboboxTrigger(root);
  if (trigger) {
    await trigger.click(options);
    return;
  }
  await root.click(options);
}

async function didSelectionApply(
  root: Loc['el'],
  option: Loc['el'],
  before: string | null,
  optionLabel: string | null,
  options?: SetOptions,
): Promise<boolean> {
  const ariaSelected = await option.getAttribute('aria-selected', options).catch(() => null);
  if (ariaSelected === 'true') return true;

  const optionId = await option.getAttribute('id', options).catch(() => null);
  const activeDescendant = await root.getAttribute('aria-activedescendant', options).catch(() => null);
  if (optionId && activeDescendant === optionId) return true;

  const after = await getRootValueText(root, options);

  if (before !== null && after !== null && after !== before) return true;

  const listbox = await getVisibleListbox(root, options);
  if (!listbox) return true;

  if (optionLabel) {
    const selectedOption = listbox.getByRole('option', { name: caseInsensitiveExact(optionLabel) }).first();
    if ((await selectedOption.count()) > 0) {
      const selected = await selectedOption.getAttribute('aria-selected', options).catch(() => null);
      if (selected === 'true') return true;
    }
  }

  return false;
}

export async function selectAria({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'string' && typeof value !== 'number') return false;

  const root = await getComboboxRoot(el, options);
  if (!root) return false;

  let listbox = await getControlledListbox(root, options);

  const ariaExpanded = await root.getAttribute('aria-expanded', options).catch(
    /* v8 ignore next — attribute might be missing or element might have detached during the check */
    () => null,
  );
  if (ariaExpanded !== 'true') {
    await openCombobox(root, options);
    listbox = listbox ?? (await getControlledListbox(root, options));
  }

  listbox = listbox ?? (await getVisibleListbox(root, options));
  if (!listbox) return false;

  const stringValue = String(value);
  const before = await getRootValueText(root, options);

  // 1. By value attribute
  const byValue = listbox.locator(
    `[role="option"]${cssAttrEquals('value', stringValue)}, ` +
      `[role="option"]${cssAttrEquals('data-value', stringValue)}, ` +
      `[role="option"]${cssAttrEquals('ng-reflect-value', stringValue)}`,
  );
  if ((await byValue.count()) >= 1) {
    const option = byValue.first();
    const optionLabel = (await option.textContent(options).catch(() => null))?.replace(/\s+/g, ' ').trim() || null;
    await option.click(options);
    return await didSelectionApply(root, option, before, optionLabel, options);
  }

  // 2. By accessible name (case-insensitive)
  const byName = listbox.getByRole('option', { name: caseInsensitiveExact(stringValue) });
  if ((await byName.count()) >= 1) {
    const option = byName.first();
    const optionLabel = (await option.textContent(options).catch(() => null))?.replace(/\s+/g, ' ').trim() || null;
    await option.click(options);
    return await didSelectionApply(root, option, before, optionLabel, options);
  }

  return false;
}
