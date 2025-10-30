import { describe, it, expect } from 'vitest';
import { compileLocator } from '../../src/locator';

// Reordered and expanded examples: start with basic locator strings, then add complexity
// moving on to `with` predicates and finally `within` ancestry and raw selectors.

describe('compileLocator', () => {
  // ----- Basic locators -----
  it('tag only: section → section', () => {
    expect(compileLocator('section')).toBe('section');
  });

  it('role with name: button "Submit" → internal:role=button [name="Submit"i]', () => {
    expect(compileLocator('button "Submit"')).toBe('internal:role=button [name="Submit"i]');
  });

  it('role with name: the button "Submit" → internal:role=button [name="Submit"i]', () => {
    expect(compileLocator('the button "Submit"')).toBe('internal:role=button [name="Submit"i]');
  });

  it('field: field "Email" → field="Email"i', () => {
    expect(compileLocator('field "Email"')).toBe('field="Email"i');
  });

  it('image: image "Hero" → internal:attr=[alt="Hero"i]', () => {
    expect(compileLocator('image "Hero"')).toBe('internal:attr=[alt="Hero"i]');
  });

  it('text: text "Hello" → internal:text="Hello"i', () => {
    expect(compileLocator('text "Hello"')).toBe('internal:text="Hello"i');
  });

  // ----- Predicates with `with` / `without` -----
  it('link without text "Ad" → internal:role=link >> internal:has-not="internal:text=\"Ad\"i"', () => {
    expect(compileLocator('link without text "Ad"')).toBe(
      'internal:role=link >> internal:has-not="internal:text=\"Ad\"i"',
    );
  });
  it('the link without the text "Ad" → internal:role=link >> internal:has-not="internal:text=\"Ad\"i"', () => {
    expect(compileLocator('the link without the text "Ad"')).toBe(
      'internal:role=link >> internal:has-not="internal:text=\"Ad\"i"',
    );
  });

  it('section with text "Hello" → section >> internal:has="internal:text=\"Hello\"i"', () => {
    expect(compileLocator('section with text "Hello"')).toBe(
      'section >> internal:has="internal:text=\"Hello\"i"',
    );
  });

  // ----- Ancestry with `within` (outer >> inner) -----
  it('section within `#main` → #main >> section', () => {
    expect(compileLocator('section within `#main`')).toBe('#main >> section');
  });

  it('button "Submit" within form #checkout → form#checkout >> internal:role=button [name="Submit"i]', () => {
    expect(compileLocator('button "Submit" within `form#checkout`')).toBe(
      'form#checkout >> internal:role=button [name="Submit"i]'
    );
  });

  it('field "Email" within form #signup → form#signup >> internal:label="Email"i', () => {
    expect(compileLocator('field "Email" within `form#signup`')).toBe(
      'form#signup >> field="Email"i'
    );
  });

  it('section within form #main → form#main >> section', () => {
    expect(compileLocator('section within `form#main`')).toBe('form#main >> section');
  });

  it('section with text "Hello" within `css=.foo >> nth(2)`', () => {
    expect(compileLocator('section with text "Hello" within `css=.foo >> nth(2)`')).toBe(
      'css=.foo >> nth(2) >> section >> internal:has="internal:text=\"Hello\"i"'
    );
  });
});
