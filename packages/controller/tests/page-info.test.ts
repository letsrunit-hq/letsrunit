import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageLike } from '@letsrunit/core/types';

const mockScrape = vi.fn<
  [{ html: string; url: string }],
  Promise<Record<string, string | undefined>>
>();
const mockScrapeLang = vi.fn<
  [{ html: string; url: string }],
  Promise<{ lang?: string | undefined }>
>();

vi.mock('metascraper', () => {
  return {
    default: vi
      .fn()
      .mockImplementationOnce(() => mockScrape)
      .mockImplementationOnce(() => mockScrapeLang),
  };
});

vi.mock('metascraper-title', () => ({ default: vi.fn(() => ({})) }));
vi.mock('metascraper-description', () => ({ default: vi.fn(() => ({})) }));
vi.mock('metascraper-image', () => ({ default: vi.fn(() => ({})) }));
vi.mock('metascraper-lang', () => ({ default: vi.fn(() => ({})) }));
vi.mock('metascraper-logo', () => ({ default: vi.fn(() => ({})) }));
vi.mock('metascraper-logo-favicon', () => ({ default: vi.fn(() => ({})) }));
vi.mock('metascraper-url', () => ({ default: vi.fn(() => ({})) }));

const { extractLang, extractPageInfo } = await import('../src/page-info');

type TitleFn = NonNullable<PageLike['title']>;

function createPage({
  html = '<html></html>',
  url = 'https://example.test',
  title,
}: {
  html?: string;
  url?: string;
  title?: TitleFn;
}): PageLike {
  const page: PageLike = {
    content: vi.fn(async () => html),
    url: () => url,
  };

  if (title) {
    page.title = title;
  }

  return page;
}

beforeEach(() => {
  mockScrape.mockReset();
  mockScrapeLang.mockReset();
});

describe('extractPageInfo', () => {
  it('returns meta information when available', async () => {
    const html = '<html><head></head><body></body></html>';
    const page = createPage({ html, url: 'https://example.com' });

    mockScrape.mockResolvedValue({
      url: 'https://meta.example.com',
      title: 'Meta Title',
      description: 'Meta Description',
      image: 'https://example.com/image.png',
      logo: 'https://example.com/logo.png',
      lang: 'en',
    });

    const info = await extractPageInfo(page);

    expect(mockScrape).toHaveBeenCalledWith({ html, url: 'https://example.com' });
    expect(info).toEqual({
      url: 'https://meta.example.com',
      title: 'Meta Title',
      description: 'Meta Description',
      image: 'https://example.com/image.png',
      favicon: 'https://example.com/logo.png',
      lang: 'en',
    });
  });

  it('falls back to page data when meta tags are missing', async () => {
    const titleMock = vi.fn<ReturnType<TitleFn>, Parameters<TitleFn>>(async () => 'Page Title');
    const page = createPage({
      html: '<html></html>',
      url: 'https://fallback.example',
      title: titleMock,
    });

    mockScrape.mockResolvedValue({});

    const info = await extractPageInfo(page);

    expect(titleMock).toHaveBeenCalledTimes(1);
    expect(info).toEqual({
      url: 'https://fallback.example',
      title: 'Page Title',
      description: undefined,
      image: undefined,
      favicon: undefined,
      lang: undefined,
    });
  });
});

describe('extractLang', () => {
  it('returns the language from metascraper when available', async () => {
    const html = '<html lang="fr"></html>';
    const page = createPage({ html, url: 'https://lang.example' });

    mockScrapeLang.mockResolvedValue({ lang: 'fr' });

    const lang = await extractLang(page);

    expect(mockScrapeLang).toHaveBeenCalledWith({ html, url: 'https://lang.example' });
    expect(lang).toBe('fr');
  });

  it('returns null when metascraper does not provide a language', async () => {
    const page = createPage({ html: '<html></html>', url: 'https://nolanguage.example' });

    mockScrapeLang.mockResolvedValue({});

    await expect(extractLang(page)).resolves.toBeNull();
  });
});
