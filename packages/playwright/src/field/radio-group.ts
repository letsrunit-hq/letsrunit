import type { Loc, SetOptions, Value } from './types';

export async function setRadioGroup(
  { el }: Loc,
  value: Value,
  options?: SetOptions,
): Promise<boolean> {
  if (typeof value !== 'string' && typeof value !== 'number') return false;

  const stringValue = String(value);
  if (stringValue.includes('\n') || stringValue.includes('"')) return false;

  // 1. Native: exact value attribute
  const radio = el.locator(`input[type=radio][value="${stringValue}"]`);
  if ((await radio.count()) === 1) {
    await radio.check(options);
    return true;
  }

  // 2. Native: by label text
  const radioByLabel = el.getByLabel(stringValue, { exact: true }).locator('input[type=radio]');
  if ((await radioByLabel.count()) === 1) {
    await radioByLabel.check(options);
    return true;
  }

  // 3. ARIA: exact value attribute
  const ariaRadio = el.locator(`[role="radio"][value="${stringValue}"]`);
  if ((await ariaRadio.count()) >= 1) {
    const item = ariaRadio.first();
    const ariaChecked = await item.getAttribute('aria-checked', options).catch(() => null);
    if (ariaChecked !== 'true') await item.click(options);
    return true;
  }

  // 4. ARIA: by label text
  const ariaRadioByLabel = el.getByLabel(stringValue, { exact: true }).locator('[role="radio"]');
  if ((await ariaRadioByLabel.count()) >= 1) {
    const item = ariaRadioByLabel.first();
    const ariaChecked = await item.getAttribute('aria-checked', options).catch(() => null);
    if (ariaChecked !== 'true') await item.click(options);
    return true;
  }

  return false;
}
