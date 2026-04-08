import type { Loc, SetOptions, Value } from './types';

function caseInsensitiveExact(value: string): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

function caseInsensitiveLooseExact(value: string): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*${escaped}\\s*$`, 'i');
}

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

  // 2b. Native wrappers: label text contains value
  const wrappedRadio = el.locator('label').filter({ hasText: caseInsensitiveLooseExact(stringValue) }).locator('input[type=radio]');
  if ((await wrappedRadio.count()) >= 1) {
    const wrappedLabel = el.locator('label').filter({ hasText: caseInsensitiveLooseExact(stringValue) }).first();
    await wrappedLabel.click({ ...options, force: true });
    return true;
  }

  const ariaRadios = el.getByRole('radio');
  const hasAriaRadios = (await ariaRadios.count()) > 0;

  // 3. ARIA: by accessible name
  if (hasAriaRadios) {
    const ariaRadioByName = el.getByRole('radio', { name: caseInsensitiveExact(stringValue) });
    if ((await ariaRadioByName.count()) >= 1) {
      const item = ariaRadioByName.first();
      const ariaChecked = await item.getAttribute('aria-checked', options).catch(/* v8 ignore next */ () => null);
      if (ariaChecked !== 'true') await item.click(options);

      const nextAriaChecked = await item.getAttribute('aria-checked', options).catch(/* v8 ignore next */ () => null);
      return nextAriaChecked === 'true';
    }

    // 4. ARIA: by value-like attributes
    const ariaRadioByValue = el.locator(
      `[role="radio"][value="${stringValue}"], ` +
        `[role="radio"][data-value="${stringValue}"], ` +
        `[role="radio"][aria-label="${stringValue}"]`,
    );
    if ((await ariaRadioByValue.count()) >= 1) {
      const item = ariaRadioByValue.first();
      const ariaChecked = await item.getAttribute('aria-checked', options).catch(/* v8 ignore next */ () => null);
      if (ariaChecked !== 'true') await item.click(options);

      const nextAriaChecked = await item.getAttribute('aria-checked', options).catch(/* v8 ignore next */ () => null);
      return nextAriaChecked === 'true';
    }
  }

  // 5. Native: click role radio by accessible name as last resort
  const roleRadio = el.getByRole('radio', { name: caseInsensitiveLooseExact(stringValue) });
  if ((await roleRadio.count()) >= 1) {
    await roleRadio.first().click(options);
    const checked = await roleRadio.first().isChecked(options).catch(() => false);
    return checked;
  }

  // 6. Fallback: iterate label text manually
  const labels = el.locator('label');
  const labelCount = await labels.count();
  for (let i = 0; i < labelCount; i++) {
    const label = labels.nth(i);
    const text = (await label.textContent(options).catch(() => '')).replace(/\s+/g, ' ').trim().toLowerCase();
    if (text !== stringValue.trim().toLowerCase()) continue;

    await label.click({ ...options, force: true });
    return true;
  }

  return false;
}
