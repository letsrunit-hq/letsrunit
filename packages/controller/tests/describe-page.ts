import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageLike } from '@letsrunit/core/types';

vi.mock('../src/utils/scrub-html', () => ({
  scrubHtml: vi.fn()
}));

vi.mock('../src/utils/structured-markdown', () => ({
  htmlToStructuredMarkdown: vi.fn()
}));

vi.mock('../src/page-info', () => ({
  extractPageInfo: vi.fn()
}));

vi.mock('yaml', () => ({
  stringify: vi.fn()
}));

import { describePage } from '../src/describe-page';
import { scrubHtml } from '../src/utils/scrub-html';
import { htmlToStructuredMarkdown } from '../src/utils/structured-markdown';
import { extractPageInfo } from '../src/page-info';
import { stringify as toYaml } from 'yaml';

describe('describePage', () => {
  const page: PageLike = {
    content: () => '<html></html>',
    url: () => 'https://example.test',
    title: () => 'Example'
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns structured markdown with YAML front matter', async () => {
    const info = { url: 'https://example.test', title: 'Example Title' };
    const html = '<html>content</html>';
    const markdown = '# Heading\n\nSome content';

    vi.mocked(extractPageInfo).mockResolvedValue(info);
    vi.mocked(scrubHtml).mockResolvedValue(html);
    vi.mocked(htmlToStructuredMarkdown).mockResolvedValue(markdown);
    vi.mocked(toYaml).mockReturnValue('title: Example Title\nurl: https://example.test\n');

    const result = await describePage(page);

    expect(result).toBe(
      [
        '---',
        'title: Example Title',
        'url: https://example.test',
        '---',
        '',
        '# Heading',
        '',
        'Some content'
      ].join('\n')
    );

    expect(extractPageInfo).toHaveBeenCalledWith(page);
    expect(scrubHtml).toHaveBeenCalledWith(page);
    expect(htmlToStructuredMarkdown).toHaveBeenCalledWith(html);
    expect(toYaml).toHaveBeenCalledWith(info, { lineWidth: 0 });
  });

  it('trims YAML output before composing the final document', async () => {
    vi.mocked(extractPageInfo).mockResolvedValue({ url: 'https://example.test' });
    vi.mocked(scrubHtml).mockResolvedValue('<body>trim</body>');
    vi.mocked(htmlToStructuredMarkdown).mockResolvedValue('content');
    vi.mocked(toYaml).mockReturnValue('\nfoo: bar\n\n');

    const result = await describePage(page);

    expect(result).toBe(['---', 'foo: bar', '---', '', 'content'].join('\n'));
  });
});
