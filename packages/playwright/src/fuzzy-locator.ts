import { Locator, Page } from '@playwright/test';

function debug(...args: unknown[]) {
  if (process.env.LETSRUNIT_DEBUG_FUZZY_LOCATOR === '1') {
    // eslint-disable-next-line no-console
    console.log('[fuzzyLocator]', ...args);
  }
}

/**
 * Locates an element using Playwright selectors, with lazy fallbacks.
 */
export async function fuzzyLocator(page: Page, selector: string): Promise<Locator> {
  debug('input selector:', selector);
  const primary = page.locator(selector);
  const candidates: Array<{ name: string; locator: Locator | null }> = [
    { name: 'relaxNameToHasText', locator: tryRelaxNameToHasText(page, selector) },
    { name: 'tagInsteadOfRole', locator: tryTagInsteadOfRole(page, selector) },
    { name: 'roleNameProximity', locator: tryRoleNameProximity(page, selector) },
    { name: 'fieldAlternative', locator: tryFieldAlternative(page, selector) },
    { name: 'asField', locator: tryAsField(page, selector) },
  ];

  let combined = primary;
  const enabled: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.locator) continue;
    enabled.push(candidate.name);
    combined = combined.or(candidate.locator);
  }
  debug('enabled fallbacks:', enabled.length ? enabled.join(', ') : '(none)');

  const result = combined.first();
  debug('returning locator:', result.toString());
  return result;
}

// Preserve the selector but relax [name="..."] to [has-text="..."]
// This keeps all other parts of the selector intact (prefix/suffix, additional filters).
// Examples:
//  - role=link[name="Foo"]            → role=link:has-text="Foo"
//  - css=button[name="Save"i]:visible → css=button:visible:has-text="Save"
//  - [name="Hello"]                   → :has-text="Hello"
function tryRelaxNameToHasText(page: Page, selector: string): Locator | null {
  const matchAnyNameFull = selector.match(/^(role=.*)\[name="([^"]+)"i?](.*)$/i);
  if (!matchAnyNameFull) return null;
  const [, pre, nameText, post] = matchAnyNameFull;
  const containsSelector = `${pre}${post}`;
  return page.locator(containsSelector, { hasText: nameText });
}

// Try using the tag name for `link`, `button` and `option` instead fo the aria role.
// This keeps all other parts of the selector intact (prefix/suffix, additional filters).
// Examples:
//  - role=button[name="Foo"] → css=button:has-text="Save"
function tryTagInsteadOfRole(page: Page, selector: string): Locator | null {
  const matchAnyNameFull = selector.match(/^role=(link|button|option)\s*\[name="([^"]+)"i?](.*)$/i);
  if (!matchAnyNameFull) return null;
  const [, role, nameText, post] = matchAnyNameFull;
  const tag = role === 'link' ? 'a' : role;
  const containsSelector = `css=${tag}${post}`;
  return page.locator(containsSelector, { hasText: nameText });
}

// If a role selector with a name filter fails, try proximity-based fallback while
// preserving the role and any remainder of the selector.
// Example: role=switch[name="Adres tonen"i] → text=Adres tonen >> .. >> role=switch
function tryRoleNameProximity(page: Page, selector: string): Locator | null {
  const matchRole = selector.match(/^role=(\w+)\s*\[name="([^"]+)"i?](.*)$/i);
  if (!matchRole) return null;
  const [, role, name, rest] = matchRole;
  const proximitySelector = `text=${name} >> .. >> role=${role}${rest}`;
  return page.locator(proximitySelector);
}

// Try alternatives if field is not found
// field="foo" → #foo > input  (only when name is a valid CSS identifier)
function tryFieldAlternative(page: Page, selector: string): Locator | null {
  const matchField = selector.match(/^field="([^"]+)"i?$/i);
  if (!matchField) return null;
  const [, field] = matchField;
  // Skip if the name contains characters invalid in a CSS ID selector
  if (!/^[a-zA-Z0-9_-]+$/.test(field)) return null;
  return page.locator(`#${field} > input`);
}

// Try matching using the field selector in case of role mismatch
function tryAsField(page: Page, selector: string): Locator | null {
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

  return page.locator(`field=${name}${rest}`);
}
