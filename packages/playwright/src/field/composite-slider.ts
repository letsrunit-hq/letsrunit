import type { Locator } from '@playwright/test';
import type { Loc, SetOptions, Value } from './types';

async function getSliderHandle(el: Locator, options?: SetOptions): Promise<Locator | null> {
  const byAria = el.locator('[aria-valuenow], [role="slider"]').first();
  if ((await byAria.count()) > 0) return byAria;

  const focusables = el.locator('[tabindex]');
  if ((await focusables.count()) > 0) return focusables.first();

  const buttons = el.locator('button');
  if ((await buttons.count()) > 0) return buttons.first();

  return null;
}

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

async function getValueFromHandle(handle: Locator, options?: SetOptions): Promise<number | null> {
  const fromAria = await handle.getAttribute('aria-valuenow', options).catch(() => null);
  const parsedAria = toNumber(fromAria);
  if (parsedAria !== null) return parsedAria;

  const fromText = await handle.textContent(options).catch(() => null);
  return toNumber(fromText);
}

async function getValueFromContext(el: Locator, options?: SetOptions): Promise<number | null> {
  const labelled = el.page().getByLabel('result').first();
  if ((await labelled.count()) > 0) {
    const text = await labelled.textContent(options).catch(() => null);
    const parsed = toNumber(text);
    if (parsed !== null) return parsed;
  }

  const siblingNumber = await el
    .evaluate((node) => {
      const parent = node.parentElement;
      if (!parent) return null;
      for (const child of Array.from(parent.children)) {
        if (child === node) continue;
        const text = (child.textContent ?? '').trim();
        if (!text) continue;
        const n = Number.parseFloat(text);
        if (Number.isFinite(n)) return n;
      }
      return null;
    }, options)
    .catch(() => null);

  return typeof siblingNumber === 'number' ? siblingNumber : null;
}

async function readValue(el: Locator, handle: Locator, options?: SetOptions): Promise<number | null> {
  const fromHandle = await getValueFromHandle(handle, options);
  if (fromHandle !== null) return fromHandle;
  return getValueFromContext(el, options);
}

async function waitForChangedValue(
  el: Locator,
  handle: Locator,
  previous: number,
  options?: SetOptions,
): Promise<number | null> {
  const timeout = Math.max(0, options?.timeout ?? 1000);
  const deadline = Date.now() + timeout;

  while (Date.now() <= deadline) {
    const current = await readValue(el, handle, options);
    if (current !== null && Math.abs(current - previous) >= 0.001) return current;
    await el.page().waitForTimeout(25);
  }

  return readValue(el, handle, options);
}

export async function setCompositeSlider({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'number') return false;

  const handle = await getSliderHandle(el, options);
  if (!handle) return false;

  const initial = await readValue(el, handle, options);
  if (initial === null) return false;
  if (Math.abs(initial - value) < 0.001) return true;

  await handle.focus(options);
  const page = el.page();
  const key = value > initial ? 'ArrowRight' : 'ArrowLeft';
  await page.keyboard.press(key);

  const probe = await waitForChangedValue(el, handle, initial, options);
  if (probe === null) return false;
  if (Math.abs(probe - value) < 0.001) return true;

  const step = Math.abs(probe - initial);
  if (step < 0.001) return false;

  const remaining = Math.abs(value - probe);
  const plannedPresses = Math.max(0, Math.round(remaining / step));

  for (let i = 0; i < plannedPresses; i++) {
    await page.keyboard.press(key);
  }

  let finalValue = await waitForChangedValue(el, handle, probe, options);
  if (finalValue !== null && Math.abs(finalValue - value) < 0.001) return true;

  for (let i = 0; i < 5; i++) {
    const current = finalValue ?? (await readValue(el, handle, options));
    if (current === null) return false;
    if (Math.abs(current - value) < 0.001) return true;

    const correctionKey = value > current ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.press(correctionKey);
    finalValue = await waitForChangedValue(el, handle, current, options);
  }

  return finalValue !== null && Math.abs(finalValue - value) < 0.001;
}
