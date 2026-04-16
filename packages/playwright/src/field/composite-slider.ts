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
  const maxPresses = Math.max(1, Math.min(200, Math.abs(Math.round(value - initial)) * 2));

  for (let i = 0; i < maxPresses; i++) {
    await page.keyboard.press(key);
    const current = await readValue(el, handle, options);
    if (current !== null && Math.abs(current - value) < 0.001) return true;
  }

  const finalValue = await readValue(el, handle, options);
  return finalValue !== null && Math.abs(finalValue - value) < 0.001;
}
