import { cartesian, isArray, isDate, isRange, type Range } from '@letsrunit/utils';
import type { Locator } from '@playwright/test';
import type { Loc, SetOptions, Value } from './types';

type DateOrder = Array<'day' | 'month' | 'year'>;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function buildDateString(date: Date, order: DateOrder, sep: string, pad: boolean): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();

  const parts: Record<'day' | 'month' | 'year', string> = {
    day: pad ? pad2(d) : String(d),
    month: pad ? pad2(m) : String(m),
    year: String(y),
  };

  return order.map((p) => parts[p]).join(sep);
}

function parseDateString(value: string, order: DateOrder, sep: string): Date | null {
  const raw = value.trim();
  if (!raw) return null;

  const tokens = raw.split(sep);
  if (tokens.length !== 3) return null;

  const nums = tokens.map((t) => Number(t));
  if (nums.some((n) => !Number.isFinite(n))) return null;

  const map: Record<'day' | 'month' | 'year', number> = { day: 0, month: 0, year: 0 };
  for (let i = 0; i < 3; i++) map[order[i]] = nums[i];

  const year = map.year;
  const month = map.month;
  const day = map.day;

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;

  return dt;
}

async function inferLocaleAndPattern(el: Locator, options?: SetOptions): Promise<{
  locale: string;
  order: DateOrder;
  sep: string;
}> {
  return el.evaluate(() => {
    const lang = document.documentElement.getAttribute('lang') || navigator.language || 'en-US';
    const dtf = new Intl.DateTimeFormat(lang, { year: 'numeric', month: '2-digit', day: '2-digit' });

    const parts = dtf.formatToParts(new Date(2033, 10, 22)); // 22 Nov 2033, disambiguates day vs month
    const order: Array<'day' | 'month' | 'year'> = [];
    let sep = '/';

    for (const p of parts) {
      if (p.type === 'day' || p.type === 'month' || p.type === 'year') order.push(p.type);
      if (p.type === 'literal') {
        const lit = p.value.trim();
        if (lit) sep = lit;
      }
    }

    // Fallback if Intl returns something odd
    const finalOrder = order.length === 3 ? order : (['day', 'month', 'year'] as const);

    return { locale: lang, order: finalOrder as any, sep };
  }, options);
}

async function fillAndReadBack(el: Locator, s: string, options?: SetOptions): Promise<string> {
  await el.clear(options);
  await el.fill(s, options);
  await el.evaluate((el) => el.blur(), options);

  // Some frameworks need a tiny tick.
  await el.evaluate(() => new Promise(requestAnimationFrame));

  return await el.inputValue(options);
}

function isAmbiguous(value: Date | Date[] | Range<Date>): boolean {
  return toDateArray(value).every((date) => date.getDate() <= 12);
}

function toDateArray(value: Date | Date[] | Range<Date>): Date[] {
  return isRange(value) ? [value.from, value.to] : isArray(value) ? value : [value];
}

async function setDateValue(
  el: Locator,
  value: Date | Date[] | Range<Date>,
  order: DateOrder,
  sep: string,
  pad: boolean,
  options?: SetOptions,
): Promise<boolean> {
  const dates = toDateArray(value);
  const glue = isRange(value) ? ' - ' : ',';

  const s = dates.map((d) => buildDateString(d, order, sep, pad)).join(glue);
  const back = await fillAndReadBack(el, s, options);
  if (!back) return false;

  const backParts = back.split(glue);
  const failed =
    backParts.length !== dates.length ||
    dates.some((date, i) => {
      const part = backParts[i]?.trim();
      const parsed = parseDateString(part, order, sep);
      return !parsed || !sameYMD(parsed, date);
    });

  return !failed;
}

async function tryProbe(
  el: Locator,
  value: Date | Date[] | Range<Date>,
  order: DateOrder,
  sep: string,
  pad: boolean,
  options?: SetOptions,
): Promise<boolean | null> {
  const baseDate = isRange(value) ? value.from : isArray(value) ? value[0] : value;
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const probeMonths = [m, m - 1, m + 1];

  for (const month of probeMonths) {
    const probeValue = isRange(value)
      ? { from: new Date(y, month, 22), to: new Date(y, month, 23) }
      : new Date(y, month, 22);

    const success = await setDateValue(el, probeValue, order, sep, pad, options);
    if (success) return true;
  }

  return null;
}

function sameYMD(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

async function formatCombinations(el: Locator, options?: SetOptions) {
  const { order: localeOrder, sep: localeSep } = await inferLocaleAndPattern(el, options);

  const orders: DateOrder[] = [
    localeOrder,
    ['year', 'month', 'day'], // ISO order
    ['day', 'month', 'year'],
    ['month', 'day', 'year'],
  ];

  const seenOrders = new Set<string>();
  const uniqueOrders: DateOrder[] = [];
  for (const o of orders) {
    const key = o.join(',');
    if (!seenOrders.has(key)) {
      seenOrders.add(key);
      uniqueOrders.push(o);
    }
  }

  const seps = Array.from(new Set([localeSep, '-', '/', '.']));
  const pads = [true, false];

  const combinations = cartesian(uniqueOrders, seps, pads);

  // Re-order combinations to ensure that locale and iso is second
  const score = ([o, s]: (typeof combinations)[number]) =>
    o.join(s) === localeOrder.join(localeSep) ? 0 : o.join(s) === 'year-month-day'? 1 : 2;
  combinations.sort((a, b) => score(a) - score(b));

  return { combinations, localeSep };
}

export async function setDateTextInput({ el, tag, type }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (!(value instanceof Date) && !isArray(value, isDate) && !isRange(value, isDate)) return false;

  if (tag !== 'input' && tag !== 'textarea') return false;
  if (type && type !== 'text' && type !== 'hidden') return false;

  if (await el.evaluate((el) => (el as HTMLInputElement).readOnly, options)) return false;

  const { combinations, localeSep } = await formatCombinations(el, options);
  let fallbackMatch: [DateOrder, string, boolean] | null = null;

  for (const [order, sep, pad] of combinations) {
    // Optimization: for non-locale separators, only try padded
    if (sep !== localeSep && !pad) continue;

    const success = await setDateValue(el, value, order, sep, pad, options);
    if (!success) continue;

    if (!isAmbiguous(value)) return true; // Done

    const probeResult = await tryProbe(el, value, order, sep, pad, options);

    if (probeResult === true) {
      await setDateValue(el, value, order, sep, pad, options);
      return true; // Done
    }

    // Maybe out of range? Keep as fallback
    if (probeResult === null && !fallbackMatch) fallbackMatch = [order, sep, pad];
  }

  if (fallbackMatch) {
    const [order, sep, pad] = fallbackMatch;
    await setDateValue(el, value, order, sep, pad, options);
    return true;
  }

  return false;
}
