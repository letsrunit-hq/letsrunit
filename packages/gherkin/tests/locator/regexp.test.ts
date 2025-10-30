import { describe, it, expect } from 'vitest';
import { locatorRegexp } from '../../src/locator';

// These tests ensure the lexical/grammar regexp accepts the same
// locator phrases exercised in compile.test.ts. We only check that the
// entire string matches the regexp, not how it compiles.

describe('locatorRegexp', () => {
  const regexp = new RegExp(`^(${locatorRegexp.source})$`);

  const positives = [
    // ----- Basic locators -----
    'section',
    'button "Submit"',
    'the button "Submit"',
    'field "Email"',
    'image "Hero"',
    'text "Hello"',
    'the link "Maak je pagina"',

    // ----- Predicates with `with` / `without` -----
    'link without text "Ad"',
    'the link without the text "Ad"',
    'section with text "Hello"',

    // ----- Ancestry with `within` (outer >> inner) -----
    'section within `#main`',
    'button "Submit" within `form#checkout`',
    'field "Email" within `form#signup`',
    'section within `form#main`',
    'section with text "Hello" within `css=.foo >> nth(2)`',
  ];

  it.each(positives)(`accepts: %s`, (input) => {
    expect(regexp.test(input)).toBe(true);
  });

  // A few negative cases to guard obvious malformed inputs.
  const negatives = [
    // dangling keywords
    'button with',
    'link without',
    'section within',
    // broken quotes
    'button "Submit',
    'text "Hello',
    // missing selector after within
    'field "Email" within',
  ];

  it.each(negatives)(`rejects: %s`, (input) => {
    expect(regexp.test(input)).toBe(false);
  });
});
