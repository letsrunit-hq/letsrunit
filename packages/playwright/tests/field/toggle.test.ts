import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setToggle } from '../../src/field/toggle';

describe('setToggle', () => {
  const makeEl = (role: string | null, ariaChecked: string | null) =>
    ({
      getAttribute: vi.fn().mockImplementation((attr: string) => {
        if (attr === 'role') return Promise.resolve(role);
        if (attr === 'aria-checked') return Promise.resolve(ariaChecked);
        return Promise.resolve(null);
      }),
      click: vi.fn().mockResolvedValue(undefined),
    }) as unknown as Locator;

  it('returns false if value is not boolean or null', async () => {
    const el = makeEl('checkbox', 'false');
    expect(await setToggle({ el, tag: 'button', type: null }, 'yes' as any)).toBe(false);
  });

  it('returns false if role is not checkbox or switch', async () => {
    const el = makeEl('button', 'false');
    expect(await setToggle({ el, tag: 'button', type: null }, true)).toBe(false);
  });

  it('returns false if element has no role', async () => {
    const el = makeEl(null, null);
    expect(await setToggle({ el, tag: 'button', type: null }, true)).toBe(false);
  });

  it('clicks to check a role="checkbox" that is unchecked', async () => {
    const el = makeEl('checkbox', 'false');
    const result = await setToggle({ el, tag: 'button', type: null }, true);
    expect(result).toBe(true);
    expect((el as any).click).toHaveBeenCalled();
  });

  it('clicks to uncheck a role="checkbox" that is checked', async () => {
    const el = makeEl('checkbox', 'true');
    const result = await setToggle({ el, tag: 'button', type: null }, false);
    expect(result).toBe(true);
    expect((el as any).click).toHaveBeenCalled();
  });

  it('does not click if role="checkbox" is already in desired state', async () => {
    const el = makeEl('checkbox', 'true');
    const result = await setToggle({ el, tag: 'button', type: null }, true);
    expect(result).toBe(true);
    expect((el as any).click).not.toHaveBeenCalled();
  });

  it('handles role="switch"', async () => {
    const el = makeEl('switch', 'false');
    const result = await setToggle({ el, tag: 'button', type: null }, true);
    expect(result).toBe(true);
    expect((el as any).click).toHaveBeenCalled();
  });

  it('treats null aria-checked as false', async () => {
    const el = makeEl('checkbox', null);
    const result = await setToggle({ el, tag: 'button', type: null }, true);
    expect(result).toBe(true);
    expect((el as any).click).toHaveBeenCalled();
  });
});
