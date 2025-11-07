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
  const matchRole = selector.match(/^role=(\w+)\s*\[name="([^"]+)"i?](.*)$/i);
  if (matchRole) {
    const [, role, name, rest] = matchRole;
    const fallbackSelector = `text=${name} >> .. >> role=${role}${rest}`;
    const fallback = page.locator(fallbackSelector);

    if (await fallback.count()) return fallback;
  }

  // Try alternatives if field is not found
  const matchField = selector.match(/^field="([^"]+)"i?$/i);
  if (matchField) {
    const [, field] = matchField;

    const fallback = page.locator(`#${field} > input`);
    if (await fallback.count()) return fallback;
  }

  // Nothing found, return the original locator (so caller can still wait/assert)
  return primary;
}
