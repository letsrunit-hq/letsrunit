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

  it('returns false for non-string/number value', async () => {
    const { el } = makeGroup([]);
    expect(await setRadioGroup({ el, tag: 'div', type: null }, true as any)).toBe(false);
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
