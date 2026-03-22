import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setRadioGroup } from '../../src/field/radio-group';

describe('setRadioGroup', () => {
  const makeGroup = (ariaRadios: Array<{ value: string; label: string; checked?: boolean }>) => {
    const items = ariaRadios.map(({ value, label, checked }) => ({
      getAttribute: vi.fn().mockImplementation((attr: string) => {
        if (attr === 'aria-checked') return Promise.resolve(checked ? 'true' : 'false');
        return Promise.resolve(null);
      }),
      click: vi.fn().mockResolvedValue(undefined),
      _value: value,
      _label: label,
    }));

    const el = {
      locator: vi.fn().mockImplementation((selector: string) => {
        // native path — no inputs
        if (selector.startsWith('input[type=radio]')) {
          return { count: vi.fn().mockResolvedValue(0), check: vi.fn() };
        }
        // ARIA value path
        const match = selector.match(/\[role="radio"\]\[value="([^"]+)"\]/);
        if (match) {
          const found = items.filter((i) => i._value === match[1]);
          return {
            count: vi.fn().mockResolvedValue(found.length),
            first: vi.fn().mockReturnValue(found[0] ?? null),
          };
        }
        return { count: vi.fn().mockResolvedValue(0) };
      }),
      getByLabel: vi.fn().mockImplementation((label: string) => ({
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector === 'input[type=radio]') {
            return { count: vi.fn().mockResolvedValue(0), check: vi.fn() };
          }
          if (selector === '[role="radio"]') {
            const found = items.filter(
              (i) => i._label.toLowerCase() === label.toLowerCase(),
            );
            return {
              count: vi.fn().mockResolvedValue(found.length),
              first: vi.fn().mockReturnValue(found[0] ?? null),
            };
          }
          return { count: vi.fn().mockResolvedValue(0) };
        }),
      })),
    } as unknown as Locator;

    return { el, items };
  };

  const makeGroupWithNativeRadio = (matchValue: string) => {
    const nativeRadio = {
      count: vi.fn().mockResolvedValue(1),
      check: vi.fn().mockResolvedValue(undefined),
    };
    const nativeRadioByLabel = {
      count: vi.fn().mockResolvedValue(1),
      check: vi.fn().mockResolvedValue(undefined),
    };

    const el = {
      locator: vi.fn().mockImplementation((selector: string) => {
        if (selector === `input[type=radio][value="${matchValue}"]`) return nativeRadio;
        return { count: vi.fn().mockResolvedValue(0), check: vi.fn() };
      }),
      getByLabel: vi.fn().mockImplementation(() => ({
        locator: vi.fn().mockReturnValue(nativeRadioByLabel),
      })),
    } as unknown as Locator;

    return { el, nativeRadio, nativeRadioByLabel };
  };

  it('checks a native input[type=radio] matched by value attribute', async () => {
    const { el, nativeRadio } = makeGroupWithNativeRadio('green');
    const result = await setRadioGroup({ el, tag: 'div', type: null }, 'green');
    expect(result).toBe(true);
    expect(nativeRadio.check).toHaveBeenCalled();
  });

  it('checks a native input[type=radio] matched by label when value does not match', async () => {
    // No native radio by value; has native radio by label
    const nativeRadioByLabel = {
      count: vi.fn().mockResolvedValue(1),
      check: vi.fn().mockResolvedValue(undefined),
    };
    const el = {
      locator: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(0), check: vi.fn() }),
      getByLabel: vi.fn().mockImplementation(() => ({
        locator: vi.fn().mockReturnValue(nativeRadioByLabel),
      })),
    } as unknown as Locator;

    const result = await setRadioGroup({ el, tag: 'div', type: null }, 'Blue');
    expect(result).toBe(true);
    expect(nativeRadioByLabel.check).toHaveBeenCalled();
  });

  it('returns false for non-string/number value', async () => {
    const { el } = makeGroup([]);
    expect(await setRadioGroup({ el, tag: 'div', type: null }, true as any)).toBe(false);
  });

  it('returns false for value containing double-quote or newline', async () => {
    const { el } = makeGroup([]);
    expect(await setRadioGroup({ el, tag: 'div', type: null }, 'foo"bar')).toBe(false);
    expect(await setRadioGroup({ el, tag: 'div', type: null }, 'foo\nbar')).toBe(false);
  });

  it('returns false if no matching radio found', async () => {
    const { el } = makeGroup([{ value: 'red', label: 'Red' }]);
    expect(await setRadioGroup({ el, tag: 'div', type: null }, 'green')).toBe(false);
  });

  it('clicks [role="radio"] matched by value attribute', async () => {
    const { el, items } = makeGroup([
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
    ]);
    const result = await setRadioGroup({ el, tag: 'div', type: null }, 'green');
    expect(result).toBe(true);
    expect(items[1].click).toHaveBeenCalled();
    expect(items[0].click).not.toHaveBeenCalled();
  });

  it('clicks [role="radio"] matched by label when value does not match', async () => {
    const { el, items } = makeGroup([
      { value: 'r', label: 'Red' },
      { value: 'g', label: 'Green' },
    ]);
    const result = await setRadioGroup({ el, tag: 'div', type: null }, 'Green');
    expect(result).toBe(true);
    expect(items[1].click).toHaveBeenCalled();
  });

  it('does not click if [role="radio"] is already selected', async () => {
    const { el, items } = makeGroup([{ value: 'green', label: 'Green', checked: true }]);
    const result = await setRadioGroup({ el, tag: 'div', type: null }, 'green');
    expect(result).toBe(true);
    expect(items[0].click).not.toHaveBeenCalled();
  });
});
