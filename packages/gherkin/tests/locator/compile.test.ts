import { describe, expect, it } from 'vitest';
import { compileLocator } from '../../src/locator';

// Reordered and expanded examples: start with basic locator strings, then add complexity
// moving on to `with` predicates and finally `within` ancestry and raw selectors.

describe('compileLocator', () => {
  // ----- Basic locators -----
  it('tag only: section → section', () => {
    expect(compileLocator('section')).to.eq('section');
  });

  it('role with name: button "Submit" → role=button [name="Submit"i]', () => {
    expect(compileLocator('button "Submit"')).to.eq('role=button [name="Submit"i]');
  });

  it('role with name: the button "Submit" → role=button [name="Submit"i]', () => {
    expect(compileLocator('the button "Submit"')).to.eq('role=button [name="Submit"i]');
  });

  it('field: field "Email" → field="Email"i', () => {
    expect(compileLocator('field "Email"')).to.eq('field="Email"i');
  });

  it('image: image "Hero" → [alt="Hero"i]', () => {
    expect(compileLocator('image "Hero"')).to.eq('[alt="Hero"i]');
  });

  it('text: text "Hello" → text=/Hello/i', () => {
    expect(compileLocator('text "Hello"')).to.eq('text=/Hello/i');
  });

  it('throws when field has no label string', () => {
    expect(() => compileLocator('field')).toThrow('`field` requires a label string');
  });

  it('throws when image has no alt string', () => {
    expect(() => compileLocator('image')).toThrow('`image` requires an alt string');
  });

  it('throws when text has no value string', () => {
    expect(() => compileLocator('text')).toThrow('`text` requires a string');
  });

  // ----- Date locators -----
  it('date of today → date=today', () => {
    expect(compileLocator('date of today')).to.eq('date=today');
  });

  it('date of yesterday → date=yesterday', () => {
    expect(compileLocator('date of yesterday')).to.eq('date=yesterday');
  });

  it('date today → date=today', () => {
    expect(compileLocator('date today')).to.eq('date=today');
  });

  it('date of yesterday at 15:00 → date=yesterday at 15:00', () => {
    expect(compileLocator('date of yesterday at 15:00')).to.eq('date=yesterday at 15:00');
  });

  it('date "22-08-1981" → date="22-08-1981"', () => {
    expect(compileLocator('date "22-08-1981"')).to.eq('date="22-08-1981"');
  });

  it('date of "1981-08-22T01:02:03" → date="1981-08-22T01:02:03"', () => {
    expect(compileLocator('date of "1981-08-22T01:02:03"')).to.eq('date="1981-08-22T01:02:03"');
  });

  // ----- Predicates with `with` / `without` -----
  it('link without text "Ad" → role=link >> has-not="text=/Ad/i"', () => {
    expect(compileLocator('link without text "Ad"')).to.eq('role=link >> has-not="text=/Ad/i"');
  });
  it('the link without the text "Ad" → role=link >> has-not="text=/Ad/i"', () => {
    expect(compileLocator('the link without the text "Ad"')).to.eq(
      'role=link >> has-not="text=/Ad/i"',
    );
  });

  it('section with text "Hello" → section >> has="text=/Hello/i"', () => {
    expect(compileLocator('section with text "Hello"')).to.eq('section >> has="text=/Hello/i"');
  });

  it('supports chained with/without predicates', () => {
    expect(compileLocator('button "Buy" with text "Now" without image "Ad"')).to.eq(
      'role=button [name="Buy"i] >> has="text=/Now/i" >> has-not="[alt="Ad"i]"',
    );
  });

  // ----- Ancestry with `within` (outer >> inner) -----
  it('section within `#main` → #main >> section', () => {
    expect(compileLocator('section within `#main`')).to.eq('#main >> section');
  });

  it('button "Submit" within form #checkout → form#checkout >> role=button [name="Submit"i]', () => {
    expect(compileLocator('button "Submit" within `form#checkout`')).to.eq(
      'form#checkout >> role=button [name="Submit"i]',
    );
  });

  it('field "Email" within form #signup → form#signup >> field="Email"i', () => {
    expect(compileLocator('field "Email" within `form#signup`')).to.eq('form#signup >> field="Email"i');
  });

  it('section within form #main → form#main >> section', () => {
    expect(compileLocator('section within `form#main`')).to.eq('form#main >> section');
  });

  it('section with text "Hello" within `css=.foo >> nth(2)`', () => {
    expect(compileLocator('section with text "Hello" within `css=.foo >> nth(2)`')).to.eq(
      'css=.foo >> nth(2) >> section >> has="text=/Hello/i"',
    );
  });

  it('supports multiple within clauses in parser order', () => {
    expect(compileLocator('button "Save" within `section` within `#root`')).to.eq(
      'section >> #root >> role=button [name="Save"i]',
    );
  });

  it('is case-insensitive for grammar keywords', () => {
    expect(compileLocator('THE button "Submit" WITHOUT text "Ad" WITHIN `#main`')).to.eq(
      '#main >> role=button [name="Submit"i] >> has-not="text=/Ad/i"',
    );
  });

  it('escapes regex metacharacters in text selectors', () => {
    expect(compileLocator('text "a+b/c?"')).to.eq('text=/a\\+b\\/c\\?/i');
  });

  it('throws for unterminated quoted strings', () => {
    expect(() => compileLocator('button "Submit')).toThrow();
  });

  it('throws for malformed raw selectors', () => {
    expect(() => compileLocator('section within `#main')).toThrow();
  });

  it('rejects keyword-like fragments that are not valid keywords', () => {
    expect(() => compileLocator('section withinx `#main`')).toThrow();
  });
});
