import { Locator, Page } from '@playwright/test';

type LocatorOptions = Parameters<Page['locator']>[1];

/**
 * Locates an element using Playwright selectors, with fallbacks.
 */
export async function locator(page: Page, selector: string): Promise<Locator> {
  const primary = page.locator(selector).first();
  if (await primary.count()) return primary;

  return await tryRelaxNameToHasText(page, selector)
    || await tryTagInsteadOfRole(page, selector)
    || await tryRoleNameProximity(page, selector)
    || await tryFieldAlternative(page, selector)
    || await tryAsField(page, selector)
    || primary; // Nothing found, return the original locator (so caller can still wait/assert)
}

async function firstMatch(page: Page, sel: string | string[], opts: LocatorOptions = {}): Promise<Locator | null> {
  for (const selector of Array.isArray(sel) ? sel : [sel]) {
    const loc = page.locator(selector, opts).first();
    if (await loc.count()) return loc;
  }

  return null;
}

// Preserve the selector but relax [name="..."] to [has-text="..."]
// This keeps all other parts of the selector intact (prefix/suffix, additional filters).
// Examples:
//  - role=link[name="Foo"]            → role=link:has-text="Foo"
//  - css=button[name="Save"i]:visible → css=button:visible:has-text="Save"
//  - [name="Hello"]                   → :has-text="Hello"
async function tryRelaxNameToHasText(page: Page, selector: string): Promise<Locator | null> {
  const matchAnyNameFull = selector.match(/^(role=.*)\[name="([^"]+)"i?](.*)$/i);
  if (!matchAnyNameFull) return null;
  const [, pre, nameText, post] = matchAnyNameFull;
  const containsSelector = `${pre}${post}`;
  return firstMatch(page, containsSelector, { hasText: nameText });
}

// Try using the tag name for `link`, `button` and `option` instead fo the aria role.
// This keeps all other parts of the selector intact (prefix/suffix, additional filters).
// Examples:
//  - role=button[name="Foo"] → css=button:has-text="Save"
async function tryTagInsteadOfRole(page: Page, selector: string): Promise<Locator | null> {
  const matchAnyNameFull = selector.match(/^role=(link|button|option)\s*\[name="([^"]+)"i?](.*)$/i);
  if (!matchAnyNameFull) return null;
  const [, role, nameText, post] = matchAnyNameFull;
  const tag = role === 'link' ? 'a' : role;
  const containsSelector = `css=${tag}${post}`;
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
