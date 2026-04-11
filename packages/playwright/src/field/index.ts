import { chain, isArray, isRange } from '@letsrunit/utils';
import type { Locator } from '@playwright/test';
import { pickFieldElement } from '../utils/pick-field-element';
import { selectAria } from './aria-select';
import { setCalendarDate } from './calendar';
import { setCompositeDate } from './composite-date';
import { setCompositeSelect } from './composite-select';
import { setCompositeSlider } from './composite-slider';
import { setCompositeToggle } from './composite-toggle';
import { setDateGroup } from './date-group';
import { setDateTextInput } from './date-text-input';
import { setNativeCheckbox } from './native-checkbox';
import { setNativeDate } from './native-date';
import { setNativeInput } from './native-input';
import { selectNative } from './native-select';
import { setOtpValue } from './otp';
import { setRadioGroup } from './radio-group';
import { setSliderValue } from './slider';
import { setToggle } from './toggle';
import type { Loc, SetOptions, Value } from './types';

function toString(value: Value): string {
  if (isRange(value)) return `${String(value.from)} - ${String(value.to)}`;
  if (isArray(value)) return value.map((v) => String(v)).join('\n');
  return String(value);
}

async function setFallback({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  await el.fill(toString(value), options); // Will likely fail, but will have a good error.
  return true;
}

export async function setFieldValue(el: Locator, value: Value, options?: SetOptions): Promise<void> {
  const setValue = chain(
    // native
    selectNative,
    selectAria,
    setNativeCheckbox,
    setRadioGroup,
    setNativeDate,
    setNativeInput,
    // aria / components
    setToggle,
    setDateTextInput,
    setDateGroup,
    setCalendarDate,
    setOtpValue,
    setSliderValue,
    // generic non-semantic composite controls
    setCompositeToggle,
    setCompositeSelect,
    setCompositeSlider,
    setCompositeDate,
    // fallback (eg contenteditable or will fail)
    setFallback,
  );

  if ((await el.count()) > 1) {
    el = await pickFieldElement(el);
  }

  const tag = await el.evaluate((e) => e.tagName.toLowerCase(), options);
  const type = (
    await el.getAttribute('type', options).catch(
      /* v8 ignore next — attribute might be missing or element might have detached during the check */
      () => null,
    )
  )?.toLowerCase();
  const loc = { el, tag, type: type || null };

  await setValue(loc, value, options);
}
