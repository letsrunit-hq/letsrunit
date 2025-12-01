import { describe, expect, it } from 'vitest';
import { realScrubHtml } from '../src/scrub-html';

describe('scrubHtml', () => {
  it('removes the head element by default', async () => {
    const html = '<html><head><title>Hidden</title></head><body><main>Content</main></body></html>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page);

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
      '</body>',
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page);

    expect(output).toBe('<div>Keep me</div>');
  });

  it('retains head content when dropHead is disabled', async () => {
    const html = '<html><head><meta name="test" content="keep" /></head><body><main>Body</main></body></html>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page, { dropHead: false });

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
      '</body>',
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page);

    expect(output).toBe('<div><section><em>Visible</em></section></div>');
  });

  it('keeps hidden elements when dropHidden is disabled', async () => {
    const html = '<body><ul><li hidden>Secret</li><li>Shown</li></ul></body>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page, { dropHidden: false });

    expect(output).toBe('<ul><li>Secret</li><li>Shown</li></ul>');
  });

  it('removes descendants of elements that are hidden by style or attributes', async () => {
    const html = [
      '<body>',
      '<div style="display:none"><span>Hidden descendant</span></div>',
      '<section hidden><p>Also hidden</p></section>',
      '<article inert><p>No render</p></article>',
      '<div><p>Visible</p></div>',
      '</body>',
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page);

    expect(output).toBe('<div><p>Visible</p></div>');
  });

  it('removes disallowed attributes and javascript hrefs', async () => {
    const html = [
      '<body>',
      '<a href="javascript:alert(1)" onclick="doThing()">Link</a>',
      '<img src="image.png" style="color:red" data-test="42" integrity="abc" />',
      '</body>',
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page);

    expect(output).toBe('<a>Link</a><img src="image.png" data-test="42">');
  });

  it('preserves attributes when stripAttributes is disabled', async () => {
    const html = '<body><button onclick="x()" data-test="keep">Click</button></body>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page, { stripAttributes: 0 });

    expect(output).toBe('<button onclick="x()" data-test="keep">Click</button>');
  });

  it('removes comments by default but keeps them when disabled', async () => {
    const html = '<body><!-- comment --><p>Text</p></body>';
    const page = { html, url: 'https://example.com' };

    const defaultOutput = await realScrubHtml(page);
    const preservedOutput = await realScrubHtml(page, { dropComments: false });

    expect(defaultOutput).toBe('<p>Text</p>');
    expect(preservedOutput).toBe('<!-- comment --><p>Text</p>');
  });

  it('drops svg elements only when requested', async () => {
    const html = '<body><svg><circle cx="10" cy="10" r="5" /></svg><p>Keep</p></body>';
    const page = { html, url: 'https://example.com' };

    const keptOutput = await realScrubHtml(page);
    const droppedOutput = await realScrubHtml(page, { dropSvg: true });

    expect(keptOutput).toBe('<svg><circle cx="10" cy="10" r="5"></circle></svg><p>Keep</p>');
    expect(droppedOutput).toBe('<p>Keep</p>');
  });

  it('collapses whitespace in text nodes outside of pre/code blocks', async () => {
    const html = '<body><div>Lots   of\n   space</div><pre> exact   spacing </pre></body>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page);

    expect(output).toBe('<div>Lots of space</div><pre> exact   spacing </pre>');
  });

  it('keeps original whitespace when normalization is disabled', async () => {
    const html = '<body><p>Keep   this\n spacing</p></body>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page, { normalizeWhitespace: false });

    expect(output).toBe('<p>Keep   this\n spacing</p>');
  });

  it('replaces <br> tags inside headings with spaces', async () => {
    const html = '<body><h1>Hello<br/>World</h1><p>Line<br/>Break</p></body>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page);

    expect(output).toBe('<h1>Hello World</h1><p>Line<br>Break</p>');
  });

  it('keeps <br> tags in headings when replacement is disabled', async () => {
    const html = '<body><h2>Hello<br>World</h2></body>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page, { replaceBrInHeadings: false });

    expect(output).toBe('<h2>Hello<br>World</h2>');
  });

  it('preserves allowed semantic attributes while stripping disallowed ones', async () => {
    const html = [
      '<body>',
      '<article id="keep" class="hero" data-info="42" lang="en" onclick="bad()" style="color:red" integrity="xyz">',
      '<a href="https://example.com" rel="noopener" referrerpolicy="no-referrer" data-track="1">Link</a>',
      '</article>',
      '</body>',
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page);

    expect(output).toBe(
      '<article id="keep" class="hero" data-info="42" lang="en">' +
        '<a href="https://example.com" rel="noopener" data-track="1">Link</a>' +
        '</article>',
    );
  });

  it('keeps only the <main> section when pickMain is enabled', async () => {
    const html = '<html><body><header>Top</header><main><p>Only this</p></main><footer>Bottom</footer></body></html>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page, { pickMain: true });

    expect(output).toBe('<main><p>Only this</p></main>');
  });

  it('limits list items when limitLists is set', async () => {
    const html = '<body><ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ul></body>';
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page, { limitLists: 2 });

    expect(output).toBe('<ul><li>1</li><li>2</li></ul>');
  });

  it('limits table rows when limitLists is set', async () => {
    const html = [
      '<body>',
      '<table>',
      '<tbody>',
      '<tr><td>a</td></tr>',
      '<tr><td>b</td></tr>',
      '<tr><td>c</td></tr>',
      '</tbody>',
      '</table>',
      '</body>',
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page, { limitLists: 1 });

    expect(output).toBe('<table><tbody><tr><td>a</td></tr></tbody></table>');
  });

  it('uses aggressive attribute stripping when stripAttributes=2', async () => {
    const html = [
      '<body>',
      '<a href="/x" title="t" rel="noopener" target="_blank" data-qa="keep" referrerpolicy="no-referrer" onclick="x()">L</a>',
      '</body>',
    ].join('');
    const page = { html, url: 'https://example.com' };

    const output = await realScrubHtml(page, { stripAttributes: 2 });

    // aggressive keeps href, src, alt, title and specific data/aria test ids; drops rel/target/referrerpolicy/onclick
    expect(output).toBe('<a href="/x" title="t" data-qa="keep">L</a>');
  });
});
