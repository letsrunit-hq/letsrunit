// @vitest-environment jsdom
import type { Page } from '@playwright/test';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/screenshot', () => ({
  screenshot: vi.fn().mockResolvedValue(new File([], 'page.png', { type: 'image/png' })),
}));

import { screenshot } from '../src/screenshot';
import { extractPageInfo } from '../src/page-info';

afterEach(() => vi.restoreAllMocks());

describe('extractPageInfo', () => {
  it('extracts metadata from snapshot html', async () => {
    const screenshotFile = new File([], 'snapshot.png', { type: 'image/png' });

    const info = await extractPageInfo({
      url: 'https://example.com/products/widget?ref=1',
      html: `
        <html lang="en-GB">
          <head>
            <title>Fallback title</title>
            <meta property="og:title" content="Widget">
            <meta name="description" content="Product details">
            <meta property="og:image" content="/images/widget.png">
            <meta name="author" content="Acme">
            <meta property="og:site_name" content="Acme Shop">
            <link rel="canonical" href="/products/widget">
            <link rel="icon" href="/favicon.ico">
            <link rel="apple-touch-icon" href="/logo.png">
          </head>
          <body></body>
        </html>
      `,
      screenshot: screenshotFile,
    });

    expect(info).toEqual({
      url: 'https://example.com/products/widget',
      name: 'Widget',
      description: 'Product details',
      image: 'https://example.com/images/widget.png',
      logo: 'https://example.com/logo.png',
      author: 'Acme',
      publisher: 'Acme Shop',
      lang: 'en-GB',
      favicon: 'https://example.com/favicon.ico',
      screenshot: screenshotFile,
    });
  });

  it('extracts html and screenshot from a live page', async () => {
    const page = {
      url: vi.fn().mockReturnValue('https://example.com/login'),
      content: vi.fn().mockResolvedValue('<html><head><title>Login</title></head><body></body></html>'),
      screenshot: vi.fn(),
    } as unknown as Page;

    const info = await extractPageInfo(page);

    expect(info.name).toBe('Login');
    expect(info.url).toBe('https://example.com/login');
    expect(info.screenshot).toBeInstanceOf(File);
    expect(screenshot).toHaveBeenCalledWith(page);
  });
});
