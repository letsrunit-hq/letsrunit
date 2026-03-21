import { describe, expect, it } from 'vitest';
import { getTranslations, normalizeLang } from '../../src/translations/index';

describe('normalizeLang', () => {
  it('returns the code when it is a known language', () => {
    expect(normalizeLang('en')).toBe('en');
    expect(normalizeLang('fr')).toBe('fr');
    expect(normalizeLang('de')).toBe('de');
  });

  it('normalizes to lowercase before lookup', () => {
    expect(normalizeLang('EN')).toBe('en');
    expect(normalizeLang('FR')).toBe('fr');
  });

  it('falls back to "en" for unknown languages', () => {
    expect(normalizeLang('xx')).toBe('en');
    expect(normalizeLang('zz')).toBe('en');
  });
});

describe('getTranslations', () => {
  it('returns translations for a known language', () => {
    const tr = getTranslations('en');
    expect(tr.accept).toBeInstanceOf(Array);
    expect(tr.reject).toBeInstanceOf(Array);
    expect(tr.close).toBeInstanceOf(Array);
  });

  it('falls back to English for unknown language', () => {
    const en = getTranslations('en');
    const unknown = getTranslations('xx');
    expect(unknown).toEqual(en);
  });
});
