/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createFieldEngine } from '../src';

const engine = createFieldEngine();

describe('createFieldEngine query/queryAll', () => {
  beforeEach(() => {
    // jsdom lacks CSS.escape; provide a minimal polyfill sufficient for these tests
    if (typeof (globalThis as any).CSS === 'undefined') {
      (globalThis as any).CSS = {} as any;
    }
    if (typeof (globalThis as any).CSS.escape !== 'function') {
      (globalThis as any).CSS.escape = (s: string) => String(s).replace(/"/g, '\\"');
    }
    document.body.innerHTML = '';
  });

  it('finds inputs by implicit <label> wrapping', () => {
    document.body.innerHTML = `
      <form>
        <label>First Name <input id="first" /></label>
        <label>Last Name <input id="last" /></label>
      </form>
    `;

    const all = engine.queryAll(document, 'first');
    expect(all.map((e) => (e as HTMLElement).id)).toEqual(['first']);

    const one = engine.query(document, 'first');
    expect((one as HTMLElement | null)?.id).toBe('first');
  });

  it('finds inputs by <label for="...">', () => {
    document.body.innerHTML = `
      <label for="email">Email Address</label>
      <input id="email" />
    `;

    const all = engine.queryAll(document, 'email address');
    expect(all).toHaveLength(1);
    expect((all[0] as HTMLElement).id).toBe('email');
  });

  it('finds inputs by aria-labelledby', () => {
    document.body.innerHTML = `
      <div id="a">Phone</div>
      <div id="b">Number</div>
      <input id="phone" aria-labelledby="a b" />
    `;

    const all = engine.queryAll(document, 'phone number');
    expect(all).toHaveLength(1);
    expect((all[0] as HTMLElement).id).toBe('phone');
  });

  it('finds controls by aria-label', () => {
    document.body.innerHTML = `
      <input id="search" aria-label="Search" />
      <div role="combobox" id="country" aria-label="Country"></div>
    `;

    expect(engine.queryAll(document, 'search').map((e) => (e as HTMLElement).id)).toEqual(['search']);
    expect(engine.queryAll(document, 'country').map((e) => (e as HTMLElement).id)).toEqual(['country']);
  });

  it('matches by placeholder on input/textarea and custom role elements', () => {
    document.body.innerHTML = `
      <textarea id="bio" placeholder="Describe yourself"></textarea>
      <div role="textbox" id="custom" placeholder="Type here"></div>
      <input id="nope" />
    `;

    const byBio = engine.queryAll(document, 'describe');
    expect(byBio).toHaveLength(1);
    expect((byBio[0] as HTMLElement).id).toBe('bio');

    const byCustom = engine.queryAll(document, 'type');
    expect(byCustom).toHaveLength(1);
    expect((byCustom[0] as HTMLElement).id).toBe('custom');

    const none = engine.queryAll(document, 'missing');
    expect(none).toHaveLength(0);
  });

  it('includes various ARIA role widgets and contenteditable as candidates', () => {
    document.body.innerHTML = `
      <div role="slider" id="volume" aria-label="Volume"></div>
      <div role="spinbutton" id="qty" aria-label="Quantity"></div>
      <div contenteditable="true" id="ce" aria-label="Rich Text"></div>
      <button id="btn">Not a field</button>
    `;

    const ids = engine.queryAll(document, 'volume').concat(engine.queryAll(document, 'quantity')).concat(engine.queryAll(document, 'rich text')).map((e) => (e as HTMLElement).id);

    expect(ids.sort()).toEqual(['ce', 'qty', 'volume']);

    // Ensure non-candidates like button are not matched even if text overlaps
    expect(engine.queryAll(document, 'Not a field')).toHaveLength(0);
  });

  it('query returns the first match in DOM order and null when none', () => {
    document.body.innerHTML = `
      <label>Search <input id="a" /></label>
      <label>Search <input id="b" /></label>
    `;

    const first = engine.query(document, 'search');
    expect(first?.id).toBe('a');

    const none = engine.query(document, 'no-such-label');
    expect(none).toBeNull();
  });

  it('prefers the exact text', () => {
    document.body.innerHTML = `
      <label>Search for something <input id="a" /></label>
      <label>Search <input id="b" /></label>
    `;

    const first = engine.query(document, 'search');
    expect(first?.id).toBe('b');
  });

  it('finds the bol.com search field', () => {
    document.body.innerHTML = `
      <div class="relative grow flex items-center bg-neutral-background-input rounded-[1.5rem] pr-2 lg:max-w-[40rem] lg:my-2 lg:mx-auto
        lg:focus-within:z-[306]">
        <input id="searchfor" type="text" maxlength="75" autocorrect="off" spellcheck="false" autocomplete="off" aria-label="Zoeken" placeholder="Waar ben je naar op zoek?" data-test="search_input_trigger" class="w-full h-12 pl-6 bg-transparent border-none rounded-none outline-none
          font-inherit leading-inherit appearance-none placeholder:text-neutral-text-interactive-disabled" name="searchtext" value="">
        <button class="bg-transparent border-none rounded-none outline-none font-inherit leading-inherit appearance-none flex shrink-0 items-center justify-center p-0 text-brand-text-high cursor-pointer hover:text-brand-text-interactive-default focus-visible:bg-brand-background-interactive-default focus-visible:text-neutral-text-light-onbackground focus-visible:rounded-full focus-visible:outline-none active:bg-brand-background-high active:text-neutral-text-light-onbackground active:rounded-full active:outline-none w-10 h-10" type="submit" aria-label="Zoeken" data-analytics-id="px_search_button_click" data-test="search-button">
          <span class="[&amp;&gt;svg]:block [&amp;&gt;svg]:size-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path fill="currentColor" fill-rule="evenodd" d="M10 2a8 8 0 1 0 4.906 14.32l5.387 5.387a1 1 0 0 0 1.414-1.414l-5.387-5.387A8 8 0 0 0 10 2m-6 8a6 6 0 1 1 12 0 6 6 0 0 1-12 0" clip-rule="evenodd"></path>
            </svg>
          </span>
        </button>
      </div>
    `;

    const aria = engine.query(document, '"Zoeken"i');
    expect(aria?.id).toBe('searchfor');

    const placeholder = engine.query(document, 'Waar ben je naar op zoek?');
    expect(placeholder?.id).toBe('searchfor');
  });
});
