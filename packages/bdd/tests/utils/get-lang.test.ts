import { describe, expect, it } from 'vitest';
import { extractLangFromHtml } from '../../src/utils/extract-lang';
import { getLang } from '../../src/utils/get-lang';

describe('extractLangFromHtml', () => {
  it('returns null when no language is detected', () => {
    expect(extractLangFromHtml('<html />')).toBeNull();
  });

  it('extracts language from the html lang attribute', () => {
    expect(extractLangFromHtml('<html lang="en-US"></html>')).toBe('en-US');
  });

  it('extracts language from content-language meta tags', () => {
    const html = '<meta http-equiv="content-language" content="nl-NL">';
    expect(extractLangFromHtml(html)).toBe('nl-NL');
  });
});

describe('getLang', () => {
  it('handles page-like input with url() and content()', async () => {
    const res = await getLang({
      content: async () => '<html lang="en-US"></html>',
      url: () => 'https://example.com',
    } as any);

    expect(res).toEqual({ code: 'en', name: 'English' });
  });

  it('returns null when no language is detected', async () => {
    const res = await getLang({ html: '<html />', url: 'https://example.com' } as any);
    expect(res).toBeNull();
  });

  it('falls back to language code when ISO name is unknown', async () => {
    const res = await getLang({ html: '<html lang="zz-ZZ" />', url: 'https://example.com' } as any);

    expect(res).toEqual({ code: 'zz', name: 'zz' });
  });
});
