import { locator as resolveLocator, waitAfterInteraction } from '@letsrunit/playwright';
import { describe, expect, it, vi } from 'vitest';
import { click as clickStep, clickHold, scroll } from '../../src/steps/mouse';
import { runStep } from '../helpers';

vi.mock('@letsrunit/playwright', () => ({
  locator: vi.fn(async (_page: any, _selector: string) => testLocator),
  waitAfterInteraction: vi.fn(async () => {}),
}));

type Locator = {
  hover?: (opts: { timeout: number }) => Promise<void>;
  click?: (opts: { button: 'left' | 'right'; clickCount: number; timeout: number }) => Promise<void>;
  scrollIntoViewIfNeeded?: (opts: { timeout: number }) => Promise<void>;
};

const testLocator: Locator = {} as any;

describe('steps/mouse (definitions)', () => {
  it('performs hover and click variants with correct options and timeout 2500', async () => {
    const hover = vi.fn();
    const click = vi.fn();
    (testLocator as any).hover = hover;
    (testLocator as any).click = click;

    const page = { url: vi.fn(() => 'https://site.test/x'), keyboard: { down: vi.fn(), up: vi.fn() } } as any;

    await runStep(clickStep, 'I hover button "start"', { page } as any);
    expect((resolveLocator as any).mock.calls[0][1]).toBe('role=button [name="start"i]');
    expect(hover).toHaveBeenCalledWith({ timeout: 2500 });

    await runStep(clickStep, 'I click `#a`', { page } as any);
    expect((resolveLocator as any).mock.calls[1][1]).toBe('#a');
    expect(click).toHaveBeenCalledWith({ button: 'left', clickCount: 1, timeout: 2500 });

    await runStep(clickStep, 'I double-click `#b`', { page } as any);
    expect((resolveLocator as any).mock.calls[2][1]).toBe('#b');
    expect(click).toHaveBeenCalledWith({ button: 'left', clickCount: 2, timeout: 2500 });

    await runStep(clickStep, 'I right-click `#c`', { page } as any);
    expect((resolveLocator as any).mock.calls[3][1]).toBe('#c');
    expect(click).toHaveBeenCalledWith({ button: 'right', clickCount: 1, timeout: 2500 });

    expect(waitAfterInteraction).toHaveBeenCalled();
  });

  it('holds keys while performing the action and releases in reverse order', async () => {
    const click = vi.fn();
    (testLocator as any).click = click;

    const down = vi.fn();
    const up = vi.fn();

    const page = { url: vi.fn(() => 'https://site.test/x'), keyboard: { down, up } } as any;

    await runStep(clickHold, "I click `#x` while holding 'Alt+Shift+K'", { page } as any);

    expect(down.mock.calls.map((c) => c[0])).toEqual(['Alt', 'Shift', 'K']);
    expect(click).toHaveBeenCalledWith({ button: 'left', clickCount: 1, timeout: 2500 });
    expect(up.mock.calls.map((c) => c[0])).toEqual(['K', 'Shift', 'Alt']);
    expect(waitAfterInteraction).toHaveBeenCalled();
  });

  it('scrolls locator into view with timeout 2500', async () => {
    const scrollIntoViewIfNeeded = vi.fn();
    (testLocator as any).scrollIntoViewIfNeeded = scrollIntoViewIfNeeded;
    const page = {} as any;

    await runStep(scroll, 'I scroll `.section` into view', { page } as any);

    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('.section');
    expect(scrollIntoViewIfNeeded).toHaveBeenCalledWith({ timeout: 2500 });
  });
});
