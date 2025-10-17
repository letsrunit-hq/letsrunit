import { describe, it, expect } from 'vitest';
import { scrubHtml } from '../../src/utils/scrub-html';
import type { PageLike } from '@letsrunit/core/types';

function mockPage(html: string, url = 'https://example.com'): PageLike {
  return {
    content: async () => html,
    url: () => url
  };
}

describe('scrubHtml - heading <br> replacement', () => {
  it('replaces <br> with a space inside <h1>', async () => {
    const html = '<body><h1>Hello<br/>World</h1></body>';
    const page = mockPage(html);
    const out = await scrubHtml(page);
    expect(out).toBe('<h1>Hello World</h1>');
  });

  it('replaces multiple <br> with single spaces inside headings', async () => {
    const html = '<body><h2>A<br>B<br/>C</h2></body>';
    const page = mockPage(html);
    const out = await scrubHtml(page);
    expect(out).toBe('<h2>A B C</h2>');
  });

  it('does not change <br> outside of headings', async () => {
    const html = '<body><div>A<br/>B</div></body>';
    const page = mockPage(html);
    const out = await scrubHtml(page);
    // In non-heading elements, <br> should be preserved
    expect(out).toBe('<div>A<br>B</div>');
  });

  it('preserves <br> inside headings when option disabled', async () => {
    const html = '<body><h3>X<br/>Y</h3></body>';
    const page = mockPage(html);
    const out = await scrubHtml(page, { replaceBrInHeadings: false });
    // When disabled, <br> should remain
    expect(out).toBe('<h3>X<br>Y</h3>');
  });
});
