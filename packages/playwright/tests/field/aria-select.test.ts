import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { selectAria } from '../../src/field/aria-select';

describe('selectAria', () => {
  const makeEl = ({
    role,
    ariaControls,
    ariaExpanded,
    options,
  }: {
    role: string | null;
    ariaControls: string | null;
    ariaExpanded?: string;
    options?: Array<{ value: string | null; name: string }>;
  }) => {
    const optionLocators = (options ?? []).map(({ value, name }) => ({
      click: vi.fn().mockResolvedValue(undefined),
      getAttribute: vi.fn().mockImplementation((attr: string) => {
        if (attr === 'aria-selected') return Promise.resolve('true');
        return Promise.resolve(null);
      }),
      _value: value,
      _name: name,
    }));

    const makeOptionLocator = (found: typeof optionLocators) => {
      const first = found[0] ?? null;
      return {
      count: vi.fn().mockResolvedValue(found.length),
        first: vi.fn().mockReturnValue(first),
      };
    };

    const emptyLocator: any = {
      count: vi.fn().mockResolvedValue(0),
      waitFor: vi.fn().mockResolvedValue(undefined),
    };
    emptyLocator.first = vi.fn().mockReturnValue(emptyLocator);

    const listbox: any = {
      count: vi.fn().mockResolvedValue(1),
      first: vi.fn(),
      waitFor: vi.fn().mockResolvedValue(undefined),
      locator: vi.fn().mockImplementation((selector: string) => {
        const match = selector.match(/\[role="option"\]\[value="([^"]+)"\]/);
        if (match) {
          const found = optionLocators.filter((o) => o._value === match[1]);
          return makeOptionLocator(found);
        }
        return emptyLocator;
      }),
      getByRole: vi.fn().mockImplementation((role: string, opts?: { name?: string | RegExp }) => {
        if (role === 'option' && opts?.name) {
          const found = optionLocators.filter((o) => {
            if (opts.name instanceof RegExp) return opts.name.test(o._name);
            return o._name.toLowerCase() === String(opts.name).toLowerCase();
          });
          return makeOptionLocator(found);
        }
        return emptyLocator;
      }),
    };
    listbox.first.mockReturnValue(listbox);

    const page = {
      locator: vi.fn().mockImplementation((selector: string) => {
        if (ariaControls && selector === `[role="listbox"][id="${ariaControls}"]`) return listbox;
        if (selector === '[role="listbox"]:visible') return emptyLocator;
        return emptyLocator;
      }),
    };

    const el = {
      getAttribute: vi.fn().mockImplementation((attr: string) => {
        if (attr === 'role') return Promise.resolve(role);
        if (attr === 'aria-controls') return Promise.resolve(ariaControls);
        if (attr === 'aria-expanded') return Promise.resolve(ariaExpanded ?? 'false');
        return Promise.resolve(null);
      }),
      click: vi.fn().mockResolvedValue(undefined),
      locator: vi.fn().mockImplementation(() => emptyLocator),
      evaluate: vi.fn().mockResolvedValue('before'),
      page: vi.fn().mockReturnValue(page),
    } as unknown as Locator;

    return { el, listbox, optionLocators };
  };

  it('returns false if value is not string or number', async () => {
    const { el } = makeEl({ role: 'combobox', ariaControls: 'lb' });
    expect(await selectAria({ el, tag: 'button', type: null }, true as any)).toBe(false);
  });

  it('returns false if element has no role="combobox"', async () => {
    const { el } = makeEl({ role: null, ariaControls: 'lb' });
    expect(await selectAria({ el, tag: 'button', type: null }, 'banana')).toBe(false);
  });

  it('returns false if element has no aria-controls', async () => {
    const { el } = makeEl({ role: 'combobox', ariaControls: null });
    expect(await selectAria({ el, tag: 'button', type: null }, 'banana')).toBe(false);
  });

  it('clicks trigger to open popup, then selects option by value attribute', async () => {
    const { el, optionLocators } = makeEl({
      role: 'combobox',
      ariaControls: 'lb',
      options: [{ value: 'apple', name: 'Apple' }, { value: 'banana', name: 'Banana' }],
    });
    const result = await selectAria({ el, tag: 'button', type: null }, 'banana');
    expect(result).toBe(true);
    expect((el as any).click).toHaveBeenCalled();
    expect(optionLocators[1].click).toHaveBeenCalled();
    expect(optionLocators[0].click).not.toHaveBeenCalled();
  });

  it('falls back to accessible name match (case-insensitive) when no value attribute', async () => {
    const { el, optionLocators } = makeEl({
      role: 'combobox',
      ariaControls: 'lb',
      options: [{ value: null, name: 'Banana' }],
    });
    const result = await selectAria({ el, tag: 'button', type: null }, 'banana');
    expect(result).toBe(true);
    expect(optionLocators[0].click).toHaveBeenCalled();
  });

  it('does not click trigger if already expanded', async () => {
    const { el, optionLocators } = makeEl({
      role: 'combobox',
      ariaControls: 'lb',
      ariaExpanded: 'true',
      options: [{ value: 'banana', name: 'Banana' }],
    });
    await selectAria({ el, tag: 'button', type: null }, 'banana');
    expect((el as any).click).not.toHaveBeenCalled();
    expect(optionLocators[0].click).toHaveBeenCalled();
  });

  it('returns false if no matching option found', async () => {
    const { el } = makeEl({
      role: 'combobox',
      ariaControls: 'lb',
      options: [{ value: 'apple', name: 'Apple' }],
    });
    expect(await selectAria({ el, tag: 'button', type: null }, 'banana')).toBe(false);
  });
});
