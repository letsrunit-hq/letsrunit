import { isArray, isDate, isRange } from '@letsrunit/utils';
import type { Range } from '@letsrunit/utils';
import type { Locator } from '@playwright/test';
import { setCalendarDate } from './calendar';
import type { Loc, SetOptions, Value } from './types';

function toDates(value: Date | Date[] | Range<Date>): Date[] {
  if (isRange(value)) return [value.from, value.to];
  if (isArray(value, isDate)) return value;
  return [value];
}

function formatDate(date: Date, pattern: 'iso' | 'dmy' | 'mdy' | 'ymd'): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');

  if (pattern === 'iso' || pattern === 'ymd') return `${y}-${mm}-${dd}`;
  if (pattern === 'dmy') return `${dd}/${mm}/${y}`;
  return `${mm}/${dd}/${y}`;
}

function digits(value: string): number[] {
  return (value.match(/\d+/g) ?? []).map((v) => Number.parseInt(v, 10));
}

function matchesDateLoosely(value: string, target: Date): boolean {
  const nums = digits(value);
  if (nums.length < 3) return false;
  return nums.includes(target.getFullYear()) && nums.includes(target.getMonth() + 1) && nums.includes(target.getDate());
}

async function commitInput(input: Locator, text: string, options?: SetOptions): Promise<string> {
  await input.click(options);
  await input.clear(options);
  await input.fill(text, options);
  await input.press('Enter', options).catch(() => null);
  await input.evaluate((node) => (node as HTMLInputElement).blur(), options).catch(() => null);
  await input.evaluate(() => new Promise(requestAnimationFrame)).catch(() => null);
  return input.inputValue(options).catch(() => '');
}

async function setSingleInputDate(input: Locator, value: Date, options?: SetOptions): Promise<boolean> {
  const patterns: Array<'iso' | 'dmy' | 'mdy' | 'ymd'> = ['iso', 'dmy', 'mdy', 'ymd'];

  for (const pattern of patterns) {
    const readBack = await commitInput(input, formatDate(value, pattern), options);
    if (matchesDateLoosely(readBack, value)) return true;
  }

  return false;
}

async function getDateInputs(el: Locator, options?: SetOptions): Promise<Locator[]> {
  const rootTag = await el.evaluate((node) => node.tagName.toLowerCase(), options);
  if (rootTag === 'input') return [el];

  const inputs = el.locator('input[type="text"], input:not([type]), input');
  const count = await inputs.count();
  if (count === 0) return [];

  const result: Locator[] = [];
  for (let i = 0; i < count; i++) {
    const candidate = inputs.nth(i);
    const visible = await candidate.isVisible(options).catch(() => false);
    if (!visible) continue;
    result.push(candidate);
  }
  return result;
}

async function asLoc(el: Locator, options?: SetOptions): Promise<Loc> {
  const tag = await el.evaluate((node) => node.tagName.toLowerCase(), options);
  const type = await el
    .getAttribute('type', options)
    .then((s) => s && s.toLowerCase())
    .catch(() => null);
  return { el, tag, type };
}

async function getPickerRootFromInput(input: Locator): Promise<Locator | null> {
  const picker = input
    .locator('xpath=ancestor::*[.//input and .//*[@aria-label="calendar"]][1]')
    .first();
  if ((await picker.count()) > 0) return picker;
  return null;
}

async function setByCalendar(input: Locator, date: Date, options?: SetOptions): Promise<boolean> {
  const picker = await getPickerRootFromInput(input);
  if (!picker) return false;
  const pickerLoc = await asLoc(picker, options);
  return setCalendarDate(pickerLoc, date, options);
}

export async function setCompositeDate({ el }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (!(value instanceof Date) && !isArray(value, isDate) && !isRange(value, isDate)) return false;

  const dates = toDates(value as Date | Date[] | Range<Date>);
  const inputs = await getDateInputs(el, options);
  if (inputs.length === 0) return false;

  if (dates.length === 1) {
    const singleInput = await setSingleInputDate(inputs[0], dates[0], options);
    if (singleInput) return true;
    return setByCalendar(inputs[0], dates[0], options);
  }

  if (inputs.length < 2) return false;

  const first = await setSingleInputDate(inputs[0], dates[0], options);
  const second = await setSingleInputDate(inputs[1], dates[1], options);
  if (first && second) return true;

  const firstCal = await setByCalendar(inputs[0], dates[0], options);
  const secondCal = await setByCalendar(inputs[1], dates[1], options);
  return firstCal && secondCal;
}
