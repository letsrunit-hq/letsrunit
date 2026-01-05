export const createDateEngine = () => ({
  // Single match (Playwright will call this in some contexts)
  query(root: Element | Document, body: string): Element | null {
    const all = this.queryAll(root, body);
    return all[0] ?? null;
  },

  // All matches
  queryAll(root: Element | Document, body: string): Element[] {
    const targetDate = this._parseSelector(body);
    if (!targetDate) return [];

    const doc = root instanceof Document ? root : root.ownerDocument || document;
    const locale = doc.documentElement.lang || 'en-US';

    const candidates: { el: Element, type: 'full' | 'partial' }[] = [];
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);

    let currentNode = walker.nextNode();
    while (currentNode) {
      const el = currentNode as Element;
      const { matched, type } = this._matchesDate(el, targetDate, locale, body);
      if (matched) {
        candidates.push({ el, type });
      }
      currentNode = walker.nextNode();
    }

    // Filter to keep only the most specific elements (the ones that don't have matching children)
    // AND prioritize elements that match exactly if multiple are found in a parent-child relationship.
    const results = candidates.filter(c => {
      // If any candidate is a child of el, then el is not the most specific.
      // BUT only if that child matches as much or more than the parent.
      // If the parent is a "full" match (with year) and child is only "partial", parent might be better.
      const el = c.el;
      const hasMatchingDescendant = candidates.some(other => {
        if (other.el === el || !el.contains(other.el)) return false;
        return !(c.type === 'full' && other.type === 'partial');
      });

      return !hasMatchingDescendant;

    }).map(c => c.el);

    // If no results found, we might want to look at elements whose descendants COLLECTIVELY match.
    // However, textContent already includes descendants.
    // If we have nothing, it might be because specificity filter removed everything.
    // If specificity filter removed something, we should check if we should keep it.

    if (results.length === 0 && candidates.length > 0) {
       // Check if we have multiple candidates that together might be why we failed.
       // Actually, let's just return all candidates that don't have matching descendants.
       // (That's what results is supposed to be).
    }

    return results;
  },

  _parseSelector(body: string): Date | null {
    const now = new Date();
    const trimmed = body.toLowerCase().trim();

    if (trimmed === 'today') return now;
    if (trimmed === 'tomorrow') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d;
    }
    if (trimmed === 'yesterday') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d;
    }

    // Relative: \d+ \w+ (?:ago|from now)
    const relativeMatch = trimmed.match(/^(\d+)\s+(day|month|year)s?\s+(ago|from now)$/);
    if (relativeMatch) {
      const [_, amount, unit, direction] = relativeMatch;
      const d = new Date(now);
      const sign = direction === 'ago' ? -1 : 1;
      const val = parseInt(amount, 10) * sign;

      if (unit === 'day') d.setDate(d.getDate() + val);
      else if (unit === 'month') d.setMonth(d.getMonth() + val);
      else if (unit === 'year') d.setFullYear(d.getFullYear() + val);
      return d;
    }

    // "today at 15:00"
    const atMatch = trimmed.match(/^(today|tomorrow|yesterday)\s+at\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?$/);
    if (atMatch) {
      const [_, dayStr, hourStr, min, sec, ampm] = atMatch;
      const d = new Date(now);
      if (dayStr === 'tomorrow') d.setDate(d.getDate() + 1);
      if (dayStr === 'yesterday') d.setDate(d.getDate() - 1);

      let hour = parseInt(hourStr, 10);
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;

      d.setHours(hour, parseInt(min, 10), parseInt(sec || '0', 10), 0);
      return d;
    }

    const absDate = new Date(body);
    if (!isNaN(absDate.getTime())) return absDate;

    return null;
  },

  _matchesDate(el: Element, targetDate: Date, locale: string, body: string): { matched: boolean, type: 'full' | 'partial' } {
    const text = el.textContent?.trim() || '';
    if (!text) return { matched: false, type: 'partial' };

    // Normalize text: replace non-breaking spaces, multi-spaces, etc.
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    const cleanText = normalizedText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();

    const options: Intl.DateTimeFormatOptions[] = [
      { year: 'numeric', month: 'short', day: 'numeric' },
      { year: 'numeric', month: 'long', day: 'numeric' },
      { year: '2-digit', month: 'numeric', day: 'numeric' },
      { year: 'numeric', month: 'numeric', day: 'numeric' },
      { month: 'short', day: 'numeric' },
      { month: 'long', day: 'numeric' },
    ];

    let dateMatched = false;
    let matchType: 'full' | 'partial' = 'partial';

    for (const opt of options) {
      const formatter = new Intl.DateTimeFormat(locale, opt);
      const formatted = formatter.format(targetDate);

      const normalizedFormatted = formatted.replace(/\s+/g, ' ').trim();
      const cleanFormatted = normalizedFormatted.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();

      if (normalizedText.includes(normalizedFormatted) || cleanText.includes(cleanFormatted)) {
        // If it's a numeric match and there's a year, check if the year matches correctly
        if (opt.year && opt.month === 'numeric' && opt.day === 'numeric') {
           const yearVal = targetDate.getFullYear().toString();
           const shortYearVal = yearVal.slice(-2);
           if (!normalizedText.includes(yearVal) && !normalizedText.includes(shortYearVal)) {
              continue;
           }
        }

        // If it's a month name match and there's a year, check if the year matches correctly
        if (opt.year && (opt.month === 'short' || opt.month === 'long')) {
           const yearVal = targetDate.getFullYear().toString();
           const otherYearMatch = normalizedText.match(/\b\d{4}\b/g);
           if (otherYearMatch && !otherYearMatch.includes(yearVal)) {
              continue;
           }
        }

        dateMatched = true;
        if (opt.year) matchType = 'full';
        break;
      }

      // Try with different separators if numeric
      if (opt.month === 'numeric' && opt.day === 'numeric') {
        const parts = formatter.formatToParts(targetDate);
        const day = parts.find(p => p.type === 'day')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        const year = parts.find(p => p.type === 'year')?.value;

        if (day && month) {
          const seps = ['.', '-', '/', ' ', ''];
          const d2 = day.padStart(2, '0');
          const m2 = month.padStart(2, '0');

          const dayVariations = Array.from(new Set([day, d2]));
          const monthVariations = Array.from(new Set([month, m2]));

          let numericMatched = false;
          for (const sep of seps) {
            for (const d of dayVariations) {
              for (const m of monthVariations) {
                if (year) {
                  const y2 = year.slice(-2);
                  const yearVariations = Array.from(new Set([year, y2]));
                  for (const y of yearVariations) {
                    if (normalizedText.includes(`${d}${sep}${m}${sep}${y}`) ||
                        normalizedText.includes(`${m}${sep}${d}${sep}${y}`) ||
                        normalizedText.includes(`${y}${sep}${m}${sep}${d}`)) {
                      numericMatched = true;
                      matchType = 'full';
                      break;
                    }
                  }
                }
                if (numericMatched) break;
                // Without year - only if NOT numeric (to avoid matching 2025 as 2026 without year)
                if (normalizedText.includes(`${d}${sep}${m}`) || normalizedText.includes(`${m}${sep}${d}`)) {
                  // Only count as partial match if NO year is present in text at all
                  if (!normalizedText.match(/\d{4}/)) {
                    numericMatched = true;
                    matchType = 'partial';
                  }
                }
              }
              if (numericMatched) break;
            }
            if (numericMatched) break;
          }
          if (numericMatched) {
            dateMatched = true;
            break;
          }
        }
      }
    }

    if (!dateMatched && normalizedText.includes(targetDate.toISOString().split('T')[0])) {
      dateMatched = true;
      matchType = 'full';
    }

    if (!dateMatched) return { matched: false, type: 'partial' };

    // If we have a full match (with year), it's strong.
    // If we have a partial match, we only accept it if the query itself doesn't specify a year
    // OR if the year is implicitly current year and the element also lacks it.
    const queryHasYear = body.match(/\d{4}|'\d{2}/);
    if (queryHasYear && matchType === 'partial') {
      // If query has year, we NEED year.
      return { matched: false, type: 'partial' };
    }

    // Strict year check: if query has year, it MUST match.
    // If query is relative ("today"), and element has a year, it MUST match the target year.
    const elementYearMatch = normalizedText.match(/\b\d{4}\b/g);
    if (elementYearMatch && elementYearMatch.some(y => parseInt(y, 10) !== targetDate.getFullYear())) {
       // We only fail if the year found in text is NOT the target year.
       // But wait, what if "Post date: Jan 4, 2026. Edit date: Jan 5, 2026"
       // If we are looking for Jan 4, and we match the whole string, it has BOTH 2026.
       // So we should check if ANY of the years match?
       if (!elementYearMatch.includes(targetDate.getFullYear().toString())) {
          return { matched: false, type: 'partial' };
       }
    }

    // If query has time, we must also match time
    const queryStr = body.toLowerCase();
    const queryHasTime = queryStr.includes(' at ') || queryStr.includes(':') || (queryStr.includes('am') || queryStr.includes('pm'));

    if (queryHasTime) {
      const timeMatch = normalizedText.match(/(\d{1,2})[:.](\d{2})(?::(\d{2}))?\s*(am|pm|om|u)?/i);
      if (timeMatch) {
        const [_, h, m, s, ampm] = timeMatch;
        let hour = parseInt(h, 10);
        if (ampm?.toLowerCase() === 'pm' && hour < 12) hour += 12;
        if (ampm?.toLowerCase() === 'am' && hour === 12) hour = 0;

        if (hour !== targetDate.getHours() || parseInt(m, 10) !== targetDate.getMinutes()) {
          return { matched: false, type: 'full' }; // full because it matched date but wrong time
        }
        if (s && parseInt(s, 10) !== targetDate.getSeconds()) {
          return { matched: false, type: 'full' };
        }
      } else {
        // Query has time but element doesn't?
        // Check if ANY child has time. If we are doing collective matching, the parent should have it.
        return { matched: false, type: 'full' };
      }
    }

    return { matched: true, type: matchType };
  },
});
