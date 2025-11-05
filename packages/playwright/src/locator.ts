import { Page, Locator } from '@playwright/test';

/**
 * Locates an element using Playwright selectors, with a fallback that rewrites
 * role-based selectors with names (e.g. `role=switch[name="Adres tonen"i]`)
 * into text proximity lookups (`text=Adres tonen >> .. >> role=switch`).
 */
export async function locator(page: Page, selector: string): Promise<Locator> {
  const primary = page.locator(selector);
  if (await primary.count()) return primary;

  // Try to extract role and name from a selector like:
  //   role=switch[name="Adres tonen"i]
  const match = selector.match(/^role=(\w+)\s*\[name="([^"]+)"i?](.*)$/i);
  if (match) {
    const [, role, name, rest] = match;
    const fallbackSelector = `text=${name} >> .. >> role=${role}${rest}`;
    const fallback = page.locator(fallbackSelector);

    if (await fallback.count()) return fallback;
  }

  // Nothing found, return the original locator (so caller can still wait/assert)
  return primary;
}
