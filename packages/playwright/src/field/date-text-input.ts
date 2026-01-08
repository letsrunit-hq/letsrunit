import { cartesian } from '@letsrunit/utils';
import type { Locator } from '@playwright/test';
import type { Loc, SetOptions, Value } from './types';

type DateOrder = Array<'day' | 'month' | 'year'>;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function buildDateString(date: Date, order: DateOrder, sep: string, yearWidth: 2 | 4, pad: boolean): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();

  const parts: Record<'day' | 'month' | 'year', string> = {
    day: pad ? pad2(d) : String(d),
    month: pad ? pad2(m) : String(m),
    year: yearWidth === 2 ? String(y % 100).padStart(2, '0') : String(y),
  };

  return order.map((p) => parts[p]).join(sep);
}

function parseDateString(value: string, order: DateOrder, sep: string, yearWidthGuess: 2 | 4): Date | null {
  const raw = value.trim();
  if (!raw) return null;

  const tokens = raw.split(sep);
  if (tokens.length !== 3) return null;

  const nums = tokens.map((t) => Number(t));
  if (nums.some((n) => !Number.isFinite(n))) return null;

  const map: Record<'day' | 'month' | 'year', number> = { day: 0, month: 0, year: 0 };
  for (let i = 0; i < 3; i++) map[order[i]] = nums[i];

  let year = map.year;
  if (yearWidthGuess === 2 && year < 100) {
    year += year >= 70 ? 1900 : 2000;
  }

  const month = map.month;
  const day = map.day;

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;

  return dt;
}

async function inferLocaleAndPattern(el: Locator): Promise<{
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
  });
}

async function fillAndReadBack(el: Locator, s: string, options?: SetOptions): Promise<string> {
  // Use fill for text inputs, if a library blocks it, you can switch to type
  await el.fill('', options);
  await el.fill(s, options);

  // Blur to trigger parsing/formatting
  await el.evaluate((el) => el.blur());
  return el.inputValue();
}

async function tryFormat(
  el: Locator,
  value: Date,
  order: DateOrder,
  sep: string,
  yearWidth: 2 | 4,
  pad: boolean,
  options?: SetOptions,
): Promise<boolean> {
  const s = buildDateString(value, order, sep, yearWidth, pad);
  const back = await fillAndReadBack(el, s, options);
  const parsed = parseDateString(back, order, sep, yearWidth);
  return !!parsed && sameYMD(parsed, value);
}

function sameYMD(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

async function tryProbe(
  el: Locator,
  value: Date,
  order: DateOrder,
  sep: string,
  yearWidth: 2 | 4,
  pad: boolean,
  options?: SetOptions,
): Promise<boolean | null> {
  const y = value.getFullYear();
  const m = value.getMonth();
  const probeDates = [
    new Date(y, m, 22),
    new Date(y, m - 1, 22),
    new Date(y, m + 1, 22),
  ];

  for (const probeDate of probeDates) {
    const s = buildDateString(probeDate, order, sep, yearWidth, pad);
    const back = await fillAndReadBack(el, s, options);
    if (!back) continue;

    const parsed = parseDateString(back, order, sep, yearWidth);
    return parsed && sameYMD(parsed, probeDate);
  }

  return null;
}

export async function setDateTextInput({ el, tag, type }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (!(value instanceof Date)) return false;
  if (tag !== 'input' && tag !== 'textarea') return false;
  if (type && type !== 'text' && type !== 'hidden') return false;

  const { order: localeOrder, sep: localeSep } = await inferLocaleAndPattern(el);

  const orders: DateOrder[] = [
    localeOrder,
    ['day', 'month', 'year'],
    ['month', 'day', 'year'],
    ['year', 'month', 'day'],
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

  const seps = Array.from(new Set([localeSep, '/', '-', '.', ' ']));

  const candidates = [
    { yearWidth: 4 as const, pad: true },
    { yearWidth: 4 as const, pad: false },
    { yearWidth: 2 as const, pad: true },
  ];

  let fallbackMatch: [ DateOrder, string, (typeof candidates)[0] ] | null = null;

  const combinations = cartesian(uniqueOrders, seps, candidates);

  for (const [order, sep, c] of combinations) {
    // Optimization: for non-locale separators, only try the most common candidate
    if (sep !== localeSep && (c.yearWidth !== 4 || !c.pad)) continue;

    const success = await tryFormat(el, value, order, sep, c.yearWidth, c.pad, options);
    if (!success) continue;

    const isAmbiguous = value.getDate() <= 12;
    if (!isAmbiguous) return true; // Successfully set, we're done

    const probeResult = await tryProbe(el, value, order, sep, c.yearWidth, c.pad, options);

    if (probeResult === true) {
      await tryFormat(el, value, order, sep, c.yearWidth, c.pad, options);
      return true; // Successfully set, we're done
    }

    // Maybe out of range? Keep as fallback
    if (probeResult === null && !fallbackMatch)  fallbackMatch = [ order, sep, c ];
  }

  if (fallbackMatch) {
    const [ order, sep, c ] = fallbackMatch;
    await tryFormat(el, value, order, sep, c.yearWidth, c.pad, options);
    return true;
  }

  return false;
}
