import { chain } from '@letsrunit/utils';
import type { Locator } from '@playwright/test';
import { setCalendarDate } from './calendar';
import { setDateGroup } from './date-group';
import { setDateTextInput } from './date-text-input';
import { setNativeCheckbox } from './native-checkbox';
import { setNativeDate } from './native-date';
import { setNativeInput } from './native-input';
import { selectNative } from './native-select';
import type { Loc, SetOptions, Value } from './types';

async function setFallback({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  await el.fill(String(value), options);
  return true;
}

export async function setFieldValue(el: Locator, value: Value, options?: SetOptions): Promise<void> {
  const setValue = chain(
    // native
    selectNative,
    setNativeCheckbox,
    setNativeDate,
    setNativeInput,
    // aria / components
    setDateTextInput,
    setDateGroup,
    setCalendarDate,
    // fallback (eg contenteditable or will fail)
    setFallback,
  );

  const tag = await el.evaluate((e) => e.tagName.toLowerCase());
  const type = await el
    .getAttribute('type', options)
    .then((s) => s && s.toLowerCase())
    .catch(() => null);
  const loc = { el, tag, type };

  await setValue(loc, value, options);
}
