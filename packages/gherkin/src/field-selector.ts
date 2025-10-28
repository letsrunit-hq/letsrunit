export const createFieldEngine = () => ({
  // Helper: compile matcher from `field=...` body
  _compileMatcher(body: string, exact: boolean): (s: string | null | undefined) => boolean {
    const trimmed = body.trim();

    // Support /regex/flags
    if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
      if (exact) return () => false;

      const last = trimmed.lastIndexOf('/');
      const pattern = trimmed.slice(1, last);
      const flags = trimmed.slice(last + 1);
      const re = new RegExp(pattern, flags);
      return (s) => !!s && re.test(s);
    }

    // Default: substring match (always case-insensitive)
    const needle = trimmed.replace(/^"(.*)"(i?)$/, '$1').toLowerCase();

    return exact
      ? ((s) => s?.toLowerCase().trim() === needle)
      : ((s) => !!s && s.toLowerCase().includes(needle));
  },

  // Single match (Playwright will call this in some contexts)
  query(root: Element | Document, body: string): Element | null {
    const all = this.queryAll(root, body);
    return all[0] ?? null;
  },

  // All matches
  queryAll(root: Element | Document, body: string): Element[] {
    const match = this._compileMatcher(body, false);
    const exact = this._compileMatcher(body, true);

    // Candidate controls: native fields + common ARIA widgets
    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>(
        [
          'input',
          'textarea',
          'select',
          '[role="textbox"]',
          '[role="combobox"]',
          '[role="spinbutton"]',
          '[role="slider"]',
          '[role="switch"]',
          '[role="checkbox"]',
          '[role="radio"]',
          '[role="radiogroup"]',
          '[contenteditable=""]',
          '[contenteditable="true"]',
        ].join(', '),
      ),
    );

    const byId = new Map<string, Element>();
    // Build quick lookup for aria-labelledby resolution
    Array.from(root.querySelectorAll<HTMLElement>('[id]')).forEach((el) => byId.set(el.id, el));

    function textFor(el: HTMLElement): string[] {
      const texts: string[] = [];

      // 1) Implicit <label> wrapping
      let parent: HTMLElement | null = el.parentElement;
      while (parent) {
        if (parent.tagName === 'LABEL') {
          texts.push(parent.textContent ?? '');
          break;
        }
        parent = parent.parentElement;
      }

      // 2) <label for="...">
      let id = (el as HTMLElement).id;
      if (!id) { // support parent div/span id when element lacks one
        const p = el.parentElement as HTMLElement | null;
        if (p && (p.tagName === 'DIV' || p.tagName === 'SPAN') && p.id) {
          id = p.id;
        }
      }
      if (id) {
        const forLabels = Array.from(
          root.querySelectorAll<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`),
        );
        forLabels.forEach((l) => texts.push(l.textContent ?? ''));
      }

      // 3) aria-label
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) texts.push(ariaLabel);

      // 4) aria-labelledby
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const extAriaLabel = labelledBy.split(/\s+/)
          .map((idref) => byId.get(idref))
          .filter((ref) => !!ref?.textContent.trim())
          .map((ref) => ref!.textContent)
          .join(' ');
        if (extAriaLabel) texts.push(extAriaLabel);
      }

      // 5) native placeholder on <input>/<textarea>, and some custom widgets mirror it as an attribute
      const ph = (el as HTMLInputElement).placeholder ?? el.getAttribute('placeholder');
      if (ph) texts.push(ph);

      return texts;
    }

    // Filter candidates by label OR placeholder
    return candidates
      .map((el) => ({ el, texts: textFor(el) }))
      .filter(({ texts }) => texts.some(match))
      .sort((a, b) => Number(b.texts.some(exact)) - Number(a.texts.some(exact)))
      .map(({ el }) => el);
  },
});
