import type { Loc, SetOptions, Value } from './types';

export async function setDateGroup({ el, tag }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (!(value instanceof Date) || tag === 'input' || tag === 'textarea' || tag === 'select') return false;

  const candidates = await el.locator('input, select').all();
  if (candidates.length < 2 || candidates.length > 3) return false;

  const candidateLocs = await Promise.all(
    candidates.map(async (c) => {
      const info = await c.evaluate((node) => {
        const e = node as HTMLInputElement | HTMLSelectElement;
        const attrs: Record<string, string> = {};
        for (const attr of e.attributes) {
          attrs[attr.name] = attr.value;
        }

        let options: { value: string; text: string }[] = [];
        if (e.tagName.toLowerCase() === 'select') {
          options = Array.from((e as HTMLSelectElement).options).map((o) => ({
            value: o.value,
            text: o.text,
          }));
        }

        return {
          tag: e.tagName.toLowerCase(),
          type: e.getAttribute('type'),
          name: e.getAttribute('name'),
          id: e.getAttribute('id'),
          ariaLabel: e.getAttribute('aria-label'),
          placeholder: e.getAttribute('placeholder'),
          min: e.getAttribute('min'),
          max: e.getAttribute('max'),
          inputMode: e.getAttribute('inputmode'),
          attrs,
          options,
        };
      });
      return { el: c, ...info };
    }),
  );

  type Score = { day: number; month: number; year: number };
  const scores: Score[] = candidateLocs.map(() => ({ day: 0, month: 0, year: 0 }));

  candidateLocs.forEach((loc, i) => {
    const text = [loc.name, loc.id, loc.ariaLabel, loc.placeholder, ...Object.values(loc.attrs)]
      .join(' ')
      .toLowerCase();

    // 1. Text signals
    if (/\b(day|dd|d)\b/i.test(text)) scores[i].day += 5;
    if (/\b(month|mm|m)\b/i.test(text)) scores[i].month += 5;
    if (/\b(year|yyyy|yy|y)\b/i.test(text)) scores[i].year += 5;

    // 2. Attribute signals
    if (loc.max) {
      const max = parseInt(loc.max, 10);
      if (max >= 1 && max <= 31) scores[i].day += 2;
      if (max >= 1 && max <= 12) scores[i].month += 2;
      if (max > 1900) scores[i].year += 2;
    }

    if (loc.tag === 'select') {
      if (loc.options.length >= 12 && loc.options.length <= 13) {
        scores[i].month += 3;
      }
      const allNumeric = loc.options.every((o) => !isNaN(parseInt(o.value, 10)) || !o.value);
      if (allNumeric && loc.options.length >= 12 && loc.options.length <= 13) {
        scores[i].month += 2;
      }
    }
  });

  // 3. Behavioral probe as last resort
  const sorted = [...scores].sort((a, b) => Math.max(b.day, b.month, b.year) - Math.max(a.day, a.month, a.year));
  if (sorted[0].day < 2 && sorted[0].month < 2 && sorted[0].year < 2) {
    for (let i = 0; i < candidateLocs.length; i++) {
      const loc = candidateLocs[i];
      if (loc.tag === 'input') {
        const can_be_day = await loc.el.evaluate((node) => {
          const e = node as HTMLInputElement;
          const old = e.value;
          e.value = '31';
          const valid = e.checkValidity();
          e.value = old;
          return valid;
        });
        if (can_be_day) scores[i].day += 1;

        const cannot_be_day = await loc.el.evaluate((node) => {
          const e = node as HTMLInputElement;
          const old = e.value;
          e.value = '32';
          const valid = !e.checkValidity();
          e.value = old;
          return valid;
        });
        if (cannot_be_day) scores[i].day += 1;

        const can_be_month = await loc.el.evaluate((node) => {
          const e = node as HTMLInputElement;
          const old = e.value;
          e.value = '12';
          const valid = e.checkValidity();
          e.value = old;
          return valid;
        });
        if (can_be_month) scores[i].month += 1;

        const cannot_be_month = await loc.el.evaluate((node) => {
          const e = node as HTMLInputElement;
          const old = e.value;
          e.value = '13';
          const valid = !e.checkValidity();
          e.value = old;
          return valid;
        });
        if (cannot_be_month) scores[i].month += 1;

        const can_be_year = await loc.el.evaluate((node) => {
          const e = node as HTMLInputElement;
          const old = e.value;
          e.value = '2024';
          const valid = e.checkValidity();
          e.value = old;
          return valid;
        });
        if (can_be_year) scores[i].year += 1;
      }
    }
  }

  // Tie-breaker: typical order D-M-Y or Y-M-D
  if (candidateLocs.length === 3) {
    scores[0].day += 0.1;
    scores[1].month += 0.1;
    scores[2].year += 0.1;
  }

  const result: { day?: number; month?: number; year?: number } = {};
  const used = new Set<number>();

  for (const field of ['year', 'month', 'day'] as const) {
    let bestIdx = -1;
    let bestScore = -1;
    for (let i = 0; i < scores.length; i++) {
      if (!used.has(i) && scores[i][field] > bestScore) {
        bestScore = scores[i][field];
        bestIdx = i;
      }
    }
    if (bestIdx !== -1 && bestScore > 0) {
      result[field] = bestIdx;
      used.add(bestIdx);
    }
  }

  if (result.day === undefined || result.month === undefined || result.year === undefined) {
    const candidatesStr = candidateLocs.map((c) => `${c.tag}[name=${c.name}]`).join(', ');
    throw new Error(`Could not reliably detect date fields for ${tag}. Detected candidates: ${candidatesStr}`);
  }

  const dayVal = value.getDate();
  const monthVal = value.getMonth() + 1;
  const yearVal = value.getFullYear();

  // Set Day
  const dayLoc = candidateLocs[result.day];
  await dayLoc.el.fill(String(dayVal), options);

  // Set Month
  const monthLoc = candidateLocs[result.month];
  if (monthLoc.tag === 'select') {
    const options_list = monthLoc.options;
    const valueMatch = options_list.find((o) => parseInt(o.value, 10) === monthVal);
    if (valueMatch) {
      await monthLoc.el.selectOption(valueMatch.value, options);
    } else {
      // Try to match by index (considering common 0-indexed or 1-indexed headers)
      // Usually month selects have 12 or 13 (with placeholder) options
      const offset = options_list.length === 13 ? 1 : 0;
      await monthLoc.el.selectOption({ index: monthVal - 1 + offset }, options);
    }
  } else {
    await monthLoc.el.fill(String(monthVal), options);
  }

  // Set Year
  const yearLoc = candidateLocs[result.year];
  await yearLoc.el.fill(String(yearVal), options);

  return true;
}
