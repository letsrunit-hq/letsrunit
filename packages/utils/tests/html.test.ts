import { describe, expect, it } from 'vitest';
import { textToHtml } from '../src';

describe('textToHtml', () => {
  it('wraps output in a div with white-space: pre and preserves text', () => {
    const input = 'hello world';
    const html = textToHtml(input);
    expect(html).toBe('<div style="white-space: pre">hello world</div>');
  });

  it('escapes HTML special characters to prevent injection', () => {
    const input = `5 < 6 & 7 > 3 "quote" 'single'`;
    const html = textToHtml(input);
    expect(html).toBe(
      '<div style="white-space: pre">5 &lt; 6 &amp; 7 &gt; 3 &quot;quote&quot; &#39;single&#39;</div>'
    );
  });

  it('linkifies http/https URLs with rel attributes and same visible text', () => {
    const input = 'Visit http://example.com or https://example.org/docs';
    const html = textToHtml(input);
    expect(html).toBe(
      '<div style="white-space: pre">Visit <a href="http://example.com" rel="noopener noreferrer">http://example.com</a> or <a href="https://example.org/docs" rel="noopener noreferrer">https://example.org/docs</a></div>'
    );
  });

  it('preserves newlines and spaces due to white-space: pre', () => {
    const input = 'line 1\n  line 2';
    const html = textToHtml(input);
    expect(html).toBe('<div style="white-space: pre">line 1\n  line 2</div>');
  });
});
