import type { Locator } from '@playwright/test';
import type { Loc, SetOptions, Value } from './types';

export async function setSliderValue({ el, tag }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'number') return false;
  if (['input', 'select', 'button', 'textarea'].includes(tag)) return false;

  const slider = await getSliderElement(el, options);
  if (!slider) return false;

  const { min, max, orientation, valuenow: initialValue } = await getSliderAttributes(slider, options);
  if (value < min || value > max) {
    throw new Error(`Value ${value} is out of range [${min}, ${max}]`);
  }
  if (initialValue === null) return false;
  if (initialValue === value) return true;

  const { centerX, centerY } = await prepareMouse(slider, options);
  const page = slider.page();

  try {
    const ratio = await calculateRatio(slider, initialValue, value, centerX, centerY, orientation, options);
    await seekValue(slider, initialValue, value, centerX, centerY, orientation, ratio, options);
  } finally {
    await page.mouse.up();
  }

  return true;
}

async function prepareMouse(slider: Locator, options?: SetOptions) {
  await slider.scrollIntoViewIfNeeded(options);

  const box = await slider.boundingBox(options);
  if (!box) throw new Error('Slider has no bounding box');

  // If height/width is 0, we use a small offset to ensure we hit the element's area
  const centerX = box.x + (box.width || 10) / 2;
  const centerY = box.y + (box.height || 10) / 2;
  const page = slider.page();

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();

  return { centerX, centerY };
}

async function seekValue(
  slider: Locator,
  initialValue: number,
  targetValue: number,
  centerX: number,
  centerY: number,
  orientation: string,
  ratio: number,
  options?: SetOptions,
) {
  const page = slider.page();

  for (let i = 0; i < 4; i++) {
    const distance = (targetValue - initialValue) / ratio;
    await moveMouse(page, centerX, centerY, orientation, distance);

    const currentValAttr = await slider.getAttribute('aria-valuenow', options);
    const currentVal = parseFloat(currentValAttr || '0');
    if (currentVal === targetValue) break;

    if (distance !== 0) {
      const newRatio = (currentVal - initialValue) / distance;
      if (newRatio !== 0) ratio = newRatio;
    }
  }
}

async function calculateRatio(
  slider: Locator,
  initialValue: number,
  targetValue: number,
  centerX: number,
  centerY: number,
  orientation: string,
  options?: SetOptions,
): Promise<number> {
  const page = slider.page();
  const testMove = targetValue > initialValue ? 20 : -20;
  await moveMouse(page, centerX, centerY, orientation, testMove);

  const valAfterMoveAttr = await slider.getAttribute('aria-valuenow', options);
  const valAfterMove = parseFloat(valAfterMoveAttr || '0');
  const diff = valAfterMove - initialValue;

  if (diff === 0) {
    throw new Error('Slider appears to be disabled or unresponsive');
  }

  return diff / testMove;
}

async function getSliderElement(el: Locator, options?: SetOptions): Promise<Locator | null> {
  const role = await el.getAttribute('role', options).catch(() => null);
  if (role === 'slider') return el;

  const slider = el.getByRole('slider');
  if ((await slider.count()) > 0) {
    return slider.first();
  }
  return null;
}

async function getSliderAttributes(slider: Locator, options?: SetOptions) {
  const [minStr, maxStr, orient, nowStr] = await Promise.all([
    slider.getAttribute('aria-valuemin', options),
    slider.getAttribute('aria-valuemax', options),
    slider.getAttribute('aria-orientation', options),
    slider.getAttribute('aria-valuenow', options),
  ]);

  return {
    min: parseFloat(minStr || '0'),
    max: parseFloat(maxStr || '100'),
    orientation: orient || 'horizontal',
    valuenow: nowStr !== null ? parseFloat(nowStr) : null,
  };
}

async function moveMouse(page: any, centerX: number, centerY: number, orientation: string, distance: number) {
  if (orientation === 'vertical') {
    await page.mouse.move(centerX, centerY - distance);
  } else {
    await page.mouse.move(centerX + distance, centerY);
  }
}
