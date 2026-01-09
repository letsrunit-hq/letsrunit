import { isRange, type Scalar } from '@letsrunit/utils';
import { diffArray } from '@letsrunit/utils/src/array';
import type { Locator } from '@playwright/test';
import type { Loc, SetOptions, Value } from './types';

export async function clearSelect(el: Locator, opts?: SetOptions) {
  const isMultiple = await el.evaluate((e) => (e as HTMLSelectElement).multiple);
  const options = await el.evaluate((e) =>
    Array.from((e as HTMLSelectElement).options).map((o) => ({
      value: o.value,
      disabled: o.disabled,
    })),
  );

  if (isMultiple) {
    await el.selectOption([], opts);
    return;
  }

  const empty = options.find((o) => o.value === '' && !o.disabled);
  if (empty) {
    await el.selectOption({ value: '' }, opts);
    return;
  }

  const firstEnabled = options.find((o) => !o.disabled);
  if (firstEnabled) {
    await el.selectOption({ value: firstEnabled.value }, opts);
  }
}

async function multiSelect(el: Locator, value: Scalar[], opts?: SetOptions) {
  const isMultiple = await el.evaluate((e) => (e as HTMLSelectElement).multiple);
  if (!isMultiple) throw new Error('Select is not multiple');

  const requested = value.map((v) => String(v));
  const selected = await el.selectOption(requested, opts);

  const missing = diffArray(selected, requested);
  if (missing.length > 0) {
    throw new Error(`Options not found in select: ${missing.join(', ')}`);
  }
}

async function singleSelect(el: Locator, value: string, opts?: SetOptions) {
  const result = await el.selectOption(value, opts);

  if (result.length === 0) {
    throw new Error(`Option "${value}" not found in select`);
  }
}

export async function selectNative({ el, tag }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (tag !== 'select') return false;

  if (value instanceof Date || isRange(value)) {
    return false;
  }

  if (value === null) {
    await clearSelect(el, options);
    return true;
  }

  if (Array.isArray(value)) {
    if (value.some((v) => v instanceof Date)) return false;
    await multiSelect(el, value, options);
    return true;
  }

  await singleSelect(el, String(value), options);
  return true;
}
