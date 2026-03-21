import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getLang', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unmock('metascraper');
    vi.unmock('metascraper-lang');
  });

  it('returns null when no language is detected', async () => {
    const scrapeMock = vi.fn().mockResolvedValue({ lang: null });
    vi.doMock('metascraper', () => ({ default: vi.fn(() => scrapeMock) }));
    vi.doMock('metascraper-lang', () => ({ default: vi.fn(() => ({})) }));

    const { getLang } = await import('../../src/utils/get-lang');
    const res = await getLang({ html: '<html />', url: 'https://example.com' } as any);

    expect(res).toBeNull();
    expect(scrapeMock).toHaveBeenCalledWith({ html: '<html />', url: 'https://example.com' });
  });

  it('handles page-like input with url() and content()', async () => {
    const scrapeMock = vi.fn().mockResolvedValue({ lang: 'en-US' });
    vi.doMock('metascraper', () => ({ default: vi.fn(() => scrapeMock) }));
    vi.doMock('metascraper-lang', () => ({ default: vi.fn(() => ({})) }));

    const { getLang } = await import('../../src/utils/get-lang');
    const res = await getLang({
      content: async () => '<html lang="en-US"></html>',
      url: () => 'https://example.com',
    } as any);

    expect(res).toEqual({ code: 'en', name: 'English' });
  });

  it('falls back to language code when ISO name is unknown', async () => {
    const scrapeMock = vi.fn().mockResolvedValue({ lang: 'zz-ZZ' });
    vi.doMock('metascraper', () => ({ default: vi.fn(() => scrapeMock) }));
    vi.doMock('metascraper-lang', () => ({ default: vi.fn(() => ({})) }));

    const { getLang } = await import('../../src/utils/get-lang');
    const res = await getLang({ html: '<html />', url: 'https://example.com' } as any);

    expect(res).toEqual({ code: 'zz', name: 'zz' });
  });
});
