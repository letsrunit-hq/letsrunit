import { Locator, Page } from '@playwright/test';

type LocatorOptions = Parameters<Page['locator']>[1];

/**
 * Locates an element using Playwright selectors, with a fallback that rewrites
 * role-based selectors with names (e.g. `role=switch[name="Adres tonen"i]`)
 * into text proximity lookups (`text=Adres tonen >> .. >> role=switch`).
 */
export async function locator(page: Page, selector: string): Promise<Locator> {
  const primary = page.locator(selector).first();
  if (await primary.count()) return primary;

  return await tryRelaxNameToHasText(page, selector)
    || await tryRoleNameProximity(page, selector)
    || await tryFieldAlternative(page, selector)
    || await tryAsField(page, selector)
    || primary; // Nothing found, return the original locator (so caller can still wait/assert)
}

async function firstMatch(page: Page, sel: string, opts: LocatorOptions = {}): Promise<Locator | null> {
  const loc = page.locator(sel, opts).first();
  return (await loc.count()) ? loc : null;
}

// First fallback: preserve the selector but relax [name="..."] to [has-text="..."]
// This keeps all other parts of the selector intact (prefix/suffix, additional filters).
// Examples:
//  - role=link[name="Foo"]            → role=link[has-text="Foo"]
//  - css=button[name="Save"i]:visible → css=button[has-text="Save"]:visible
//  - [name="Hello"]                   → [has-text="Hello"]
async function tryRelaxNameToHasText(page: Page, selector: string): Promise<Locator | null> {
  const matchAnyNameFull = selector.match(/^(.*)\[name="([^"]+)"i?](.*)$/i);
  if (!matchAnyNameFull) return null;
  const [, pre, nameText, post] = matchAnyNameFull;
  const containsSelector = `${pre}${post}`;
  return firstMatch(page, containsSelector, { hasText: nameText });
}

// If a role selector with a name filter fails, try proximity-based fallback while
// preserving the role and any remainder of the selector.
// Example: role=switch[name="Adres tonen"i] → text=Adres tonen >> .. >> role=switch
async function tryRoleNameProximity(page: Page, selector: string): Promise<Locator | null> {
  const matchRole = selector.match(/^role=(\w+)\s*\[name="([^"]+)"i?](.*)$/i);
  if (!matchRole) return null;
  const [, role, name, rest] = matchRole;
  const proximitySelector = `text=${name} >> .. >> role=${role}${rest}`;
  return firstMatch(page, proximitySelector);
}

// Try alternatives if field is not found
// field="foo" → #foo > input
async function tryFieldAlternative(page: Page, selector: string): Promise<Locator | null> {
  const matchField = selector.match(/^field="([^"]+)"i?$/i);
  if (!matchField) return null;
  const [, field] = matchField;
  return firstMatch(page, `#${field} > input`);
}

// Try matching using the field selector in case of role mismatch
async function tryAsField(page: Page, selector: string): Promise<Locator | null> {
  const matchRole = selector.match(/^role=(\w+)\s*\[name="([^"]+)"i?](.*)$/i);
  if (!matchRole) return null;

  const [, role, name, rest] = matchRole;

  // Only allow ARIA roles that correspond to field-like controls
  const fieldRoles = new Set([
    'button', // Sometimes used for date pickers or checkboxes
    'textbox',
    'searchbox',
    'combobox',
    'spinbutton',
    'slider',
    'checkbox',
    'switch',
    'radio',
    'radiogroup',
    'listbox',
    'option',
  ]);

  if (!fieldRoles.has(role.toLowerCase())) return null;

  return firstMatch(page, `field=${name}${rest}`);
}
