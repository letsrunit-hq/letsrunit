import type { Loc, SetOptions, Value } from './types';

export async function setRadioGroup(
  { el }: Loc,
  value: Value,
  options?: SetOptions,
): Promise<boolean> {
  if (typeof value !== 'string' && typeof value !== 'number') return false;

  const stringValue = String(value);
  if (stringValue.includes('\n') || stringValue.includes('"')) return false;

  const radio = el.locator(`input[type=radio][value="${stringValue}"]`);
  if ((await radio.count()) === 1) {
    await radio.check(options);
    return true;
  }

  // Also try searching by label text if value doesn't match
  const radioByLabel = el.getByLabel(String(value), { exact: true }).locator('input[type=radio]');
  if ((await radioByLabel.count()) === 1) {
    await radioByLabel.check(options);
    return true;
  }

  return false;
}
