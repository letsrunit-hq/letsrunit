import type { Locator } from '@playwright/test';
import type { Loc, SetOptions, Value } from './types';

function caseInsensitiveExact(value: string): RegExp {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

async function openControl(el: Locator, options?: SetOptions): Promise<void> {
  const activator = el
    .locator('button[aria-haspopup], [role="button"][aria-haspopup], input[readonly]')
    .first();
  if ((await activator.count()) > 0) {
    await activator.click(options);
    return;
  }
  await el.click(options);
}

function getPopupCandidates(page: any): Locator {
  return page.locator(
    [
      '[role="listbox"]:visible',
      '[role="menu"]:visible',
      '[role="dialog"]:visible',
      '[role="presentation"]:visible',
      '.cdk-overlay-pane:visible',
    ].join(', '),
  );
}

async function looksLikeCompositeSelect(el: Locator, options?: SetOptions): Promise<boolean> {
  const role = await el.getAttribute('role', options).catch(() => null);
  if (role === 'combobox' || role === 'listbox') return false;

  if ((await el.locator('input[type="radio"], input[type="checkbox"]').count()) > 0) return false;
  if ((await el.locator('[role="slider"], [aria-valuenow]').count()) > 0) return false;

  const cues = el.locator(
    [
      '[aria-haspopup]',
      '[aria-controls]',
      '[aria-owns]',
      'input[readonly]',
      'button[aria-haspopup]',
    ].join(', '),
  );
  return (await cues.count()) > 0;
}

async function getOptionFromPopup(popup: Locator, value: string, options?: SetOptions): Promise<Locator | null> {
  const byValue = popup.locator(
    `[value=${JSON.stringify(value)}], [data-value=${JSON.stringify(value)}], [aria-label=${JSON.stringify(value)}]`,
  );
  if ((await byValue.count()) > 0) return byValue.first();

  const byRole = popup.getByRole('option', { name: caseInsensitiveExact(value) });
  if ((await byRole.count()) > 0) return byRole.first();

  const byText = popup.getByText(caseInsensitiveExact(value), { exact: true });
  if ((await byText.count()) > 0) return byText.first();

  return null;
}

async function getPopupOptions(popup: Locator): Promise<Locator> {
  return popup.locator(
    [
      '[role="option"]',
      '[title]',
    ].join(', '),
  );
}

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

async function getContextNumericValue(el: Locator, options?: SetOptions): Promise<number | null> {
  const labelled = el.page().getByLabel('result').first();
  if ((await labelled.count()) > 0) {
    const text = await labelled.textContent(options).catch(() => null);
    const parsed = toNumber(text);
    if (parsed !== null) return parsed;
  }
  return null;
}

async function getRootText(el: Locator, options?: SetOptions): Promise<string> {
  return (
    (await el
      .evaluate((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim(), options)
      .catch(() => '')) || ''
  );
}

export async function setCompositeSelect({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  if (!(await looksLikeCompositeSelect(el, options))) return false;

  const stringValue = String(value);
  const before = await getRootText(el, options);
  const popupsBefore = await getPopupCandidates(el.page()).count();

  await openControl(el, options);

  const popups = await getPopupCandidates(el.page());
  await popups.first().waitFor({ state: 'visible', timeout: options?.timeout }).catch(() => null);
  const count = await popups.count();
  if (count === 0) return false;

  const popup = popups.nth(Math.max(0, count - 1));
  const option = await getOptionFromPopup(popup, stringValue, options);
  if (option) {
    await option.click({ ...options, force: true });
  }

  const after = await getRootText(el, options);
  if (after && before && after !== before) return true;

  const popupsAfter = await getPopupCandidates(el.page()).count();
  if (option && (popupsAfter < popupsBefore || popupsAfter < count)) return true;

  const targetNum = toNumber(stringValue);
  if (targetNum === null) return false;

  const optionsLoc = await getPopupOptions(popup);
  const totalOptions = await optionsLoc.count();
  if (totalOptions === 0) return false;

  const labels: string[] = [];
  for (let i = 0; i < totalOptions; i++) {
    const candidate = optionsLoc.nth(i);
    const label =
      (await candidate.getAttribute('title', options).catch(() => null)) ||
      (await candidate.textContent(options).catch(() => '')) ||
      '';
    const normalized = label.replace(/\s+/g, ' ').trim();
    if (!normalized) continue;
    if (!labels.includes(normalized)) labels.push(normalized);
  }

  for (const label of labels) {
    await openControl(el, options);
    const activePopups = getPopupCandidates(el.page());
    const activePopupCount = await activePopups.count();
    if (activePopupCount === 0) continue;
    const activePopup = activePopups.nth(Math.max(0, activePopupCount - 1));

    let candidate = activePopup.locator(`[title=${JSON.stringify(label)}]`).first();
    if ((await candidate.count()) === 0) {
      candidate = activePopup.getByText(caseInsensitiveExact(label), { exact: true }).first();
    }
    if ((await candidate.count()) === 0) continue;

    await candidate.click({ ...options, force: true });

    const numeric = await getContextNumericValue(el, options);
    if (numeric !== null && Math.abs(numeric - targetNum) < 0.001) return true;
  }

  const current = await getContextNumericValue(el, options);
  if (current === null) return false;

  await openControl(el, options);
  await el.focus(options).catch(() => null);
  const page = el.page();
  const key = targetNum > current ? 'ArrowDown' : 'ArrowUp';

  for (let i = 0; i < 20; i++) {
    await page.keyboard.press(key);
    await page.keyboard.press('Enter');
    const numeric = await getContextNumericValue(el, options);
    if (numeric !== null && Math.abs(numeric - targetNum) < 0.001) return true;
    await openControl(el, options);
    await el.focus(options).catch(() => null);
  }

  return false;
}
