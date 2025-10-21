import { describe, it, expect } from 'vitest';
import { scrubHtml } from '../../src/utils/scrub-html';

describe('scrubHtml', () => {
  it('removes the head element by default', async () => {
    const html = '<html><head><title>Hidden</title></head><body><main>Content</main></body></html>';
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page);

    expect(output).toBe('<main>Content</main>');
  });

  it('removes infrastructure tags such as script/style/template', async () => {
    const html = [
      '<body>',
      '<script>ignored()</script>',
      '<style>.ignored { color: red; }</style>',
      '<template><div>tpl</div></template>',
      '<noscript>nope</noscript>',
      '<slot>slot content</slot>',
      '<object data="data.bin"></object>',
      '<embed src="file.bin" />',
      '<div>Keep me</div>',
      '</body>'
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page);

    expect(output).toBe('<div>Keep me</div>');
  });

  it('retains head content when dropHead is disabled', async () => {
    const html = '<html><head><meta name="test" content="keep" /></head><body><main>Body</main></body></html>';
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page, { dropHead: false });

    expect(output).toBe('<main>Body</main>');
  });

  it('removes elements that are explicitly hidden', async () => {
    const html = [
      '<body>',
      '<div>',
      '<span hidden>Hidden text</span>',
      '<p style="display:none">Display none</p>',
      '<section><em>Visible</em></section>',
      '</div>',
      '</body>'
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page);

    expect(output).toBe('<div><section><em>Visible</em></section></div>');
  });

  it('keeps hidden elements when dropHidden is disabled', async () => {
    const html = '<body><ul><li hidden>Secret</li><li>Shown</li></ul></body>';
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page, { dropHidden: false });

    expect(output).toBe('<ul><li>Secret</li><li>Shown</li></ul>');
  });

  it('removes descendants of elements that are hidden by style or attributes', async () => {
    const html = [
      '<body>',
      '<div style="display:none"><span>Hidden descendant</span></div>',
      '<section hidden><p>Also hidden</p></section>',
      '<article inert><p>No render</p></article>',
      '<div><p>Visible</p></div>',
      '</body>'
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page);

    expect(output).toBe('<div><p>Visible</p></div>');
  });

  it('removes disallowed attributes and javascript hrefs', async () => {
    const html = [
      '<body>',
      '<a href="javascript:alert(1)" onclick="doThing()">Link</a>',
      '<img src="image.png" style="color:red" data-test="42" integrity="abc" />',
      '</body>'
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page);

    expect(output).toBe('<a>Link</a><img src="image.png" data-test="42">');
  });

  it('preserves attributes when stripAttributes is disabled', async () => {
    const html = '<body><button onclick="x()" data-test="keep">Click</button></body>';
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page, { stripAttributes: false });

    expect(output).toBe('<button onclick="x()" data-test="keep">Click</button>');
  });

  it('removes comments by default but keeps them when disabled', async () => {
    const html = '<body><!-- comment --><p>Text</p></body>';
    const page = { html, url: 'https://example.com' };

    const defaultOutput = await scrubHtml(page);
    const preservedOutput = await scrubHtml(page, { dropComments: false });

    expect(defaultOutput).toBe('<p>Text</p>');
    expect(preservedOutput).toBe('<!-- comment --><p>Text</p>');
  });

  it('drops svg elements only when requested', async () => {
    const html = '<body><svg><circle cx="10" cy="10" r="5" /></svg><p>Keep</p></body>';
    const page = { html, url: 'https://example.com' };

    const keptOutput = await scrubHtml(page);
    const droppedOutput = await scrubHtml(page, { dropSvg: true });

    expect(keptOutput).toBe('<svg><circle cx="10" cy="10" r="5"></circle></svg><p>Keep</p>');
    expect(droppedOutput).toBe('<p>Keep</p>');
  });

  it('collapses whitespace in text nodes outside of pre/code blocks', async () => {
    const html = '<body><div>Lots   of\n   space</div><pre> exact   spacing </pre></body>';
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page);

    expect(output).toBe('<div>Lots of space</div><pre> exact   spacing </pre>');
  });

  it('keeps original whitespace when normalization is disabled', async () => {
    const html = '<body><p>Keep   this\n spacing</p></body>';
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page, { normalizeWhitespace: false });

    expect(output).toBe('<p>Keep   this\n spacing</p>');
  });

  it('replaces <br> tags inside headings with spaces', async () => {
    const html = '<body><h1>Hello<br/>World</h1><p>Line<br/>Break</p></body>';
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page);

    expect(output).toBe('<h1>Hello World</h1><p>Line<br>Break</p>');
  });

  it('keeps <br> tags in headings when replacement is disabled', async () => {
    const html = '<body><h2>Hello<br>World</h2></body>';
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page, { replaceBrInHeadings: false });

    expect(output).toBe('<h2>Hello<br>World</h2>');
  });

  it('preserves allowed semantic attributes while stripping disallowed ones', async () => {
    const html = [
      '<body>',
      '<article id="keep" class="hero" data-info="42" lang="en" onclick="bad()" style="color:red" integrity="xyz">',
      '<a href="https://example.com" rel="noopener" referrerpolicy="no-referrer" data-track="1">Link</a>',
      '</article>',
      '</body>'
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await scrubHtml(page);

    expect(output).toBe(
      '<article id="keep" class="hero" data-info="42" lang="en">' +
      '<a href="https://example.com" rel="noopener" data-track="1">Link</a>' +
      '</article>'
    );
  });
});
