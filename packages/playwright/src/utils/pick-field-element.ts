import type { Locator } from '@playwright/test';

export async function pickFieldElement(elements: Locator): Promise<Locator> {
  const count = await elements.count();
  if (count === 1) return elements;

  const candidates: { el: Locator; tag: string; role: string | null; isVisible: boolean }[] = [];

  for (let i = 0; i < count; i++) {
    const el = elements.nth(i);
    const [tag, role, isVisible] = await el.evaluate((e) => [
      e.tagName.toLowerCase(),
      e.getAttribute('role')?.toLowerCase() || null,
      e.getAttribute('type') !== 'hidden' && e.getAttribute('aria-hidden') !== 'true',
    ]);
    candidates.push({ el, tag: tag as string, role: role as string | null, isVisible: isVisible as boolean });
  }

  // 1. If there is one of the elements is an input and the input is not hidden or has an aria indicating it is a (form) control, pick that element.
  const formControls = ['input', 'textarea', 'select'];
  const controlRoles = ['checkbox', 'radio', 'textbox', 'combobox', 'listbox', 'slider', 'spinbutton'];

  const primary = candidates.filter(
    (c) => (formControls.includes(c.tag) || (c.role && controlRoles.includes(c.role))) && c.isVisible,
  );
  if (primary.length === 1) return primary[0].el;

  // 2. If one element has an aria role that might be logical for a form component (like a `group`), pick that element.
  const groups = candidates.filter((c) => c.role === 'group');
  if (groups.length === 1) return groups[0].el;

  // 3. If one element contains the other element(s), pick the parent.
  const isParent = await elements.evaluateAll((elems) => {
    const results = elems.map((el, i) => {
      const others = elems.filter((_, j) => i !== j);
      return others.every((other) => el.contains(other));
    });
    const parentIndex = results.indexOf(true);
    return parentIndex !== -1 ? parentIndex : null;
  });

  if (isParent !== null) {
    return elements.nth(isParent);
  }

  // Return both elements and let the error (on evaluate) occur.
  return elements;
}
