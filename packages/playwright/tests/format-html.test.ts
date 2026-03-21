import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { formatHtml } from '../src/format-html';

describe('formatHtml', () => {
  it('formats a raw HTML string with 2-space indentation for block elements', async () => {
    const result = await formatHtml('<div><p>hello</p></div>');
    // rehype-format indents block-level children
    expect(result).toContain('  <p>');
  });

  it('does not add html/head/body wrappers (fragment mode)', async () => {
    const result = await formatHtml('<p>text</p>');
    expect(result).not.toContain('<html>');
    expect(result).not.toContain('<head>');
    expect(result).not.toContain('<body>');
  });

  it('calls page.content() when given a Page object', async () => {
    const content = vi.fn().mockResolvedValue('<div><p>from page</p></div>');
    const page = { content } as unknown as Page;

    const result = await formatHtml(page);

    expect(content).toHaveBeenCalledOnce();
    expect(result).toContain('<div>');
    expect(result).toContain('<p>');
  });

  it('handles empty string without throwing', async () => {
    const result = await formatHtml('');
    expect(typeof result).toBe('string');
  });

  it('handles empty body content', async () => {
    const result = await formatHtml('<div></div>');
    expect(result).toContain('<div>');
  });
});
