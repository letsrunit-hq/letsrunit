import { describe, it, expect, afterAll, vi } from 'vitest';
import { runner } from '../../../src/runner/dsl';
import '../../../src/runner/parameters';
import '../../../src/runner/steps/mouse';


type Locator = {
  hover?: (opts: { timeout: number }) => Promise<void>;
  click?: (opts: { button: 'left' | 'right'; clickCount: number; timeout: number }) => Promise<void>;
  scrollIntoViewIfNeeded?: (opts: { timeout: number }) => Promise<void>;
};

describe('steps/mouse (runner)', () => {
  afterAll(() => runner.reset());

  it('performs hover and click variants with correct options and timeout 2500', async () => {
    const hover = vi.fn();
    const click = vi.fn();
    const locator: Locator = { hover, click } as any;
    const page = { locator: vi.fn().mockReturnValue(locator), keyboard: { down: vi.fn(), up: vi.fn() } } as any;

    const feature = `
      Feature: Mouse
        Scenario: basic actions
          When I hover the #btn
          And I click the #a
          And I double-click the #b
          And I right-click the #c
    `;

    await runner.run(feature, { page } as any);

    expect(page.locator).toHaveBeenCalledWith('#btn');
    expect(hover).toHaveBeenCalledWith({ timeout: 2500 });

    expect(page.locator).toHaveBeenCalledWith('#a');
    expect(click).toHaveBeenCalledWith({ button: 'left', clickCount: 1, timeout: 2500 });

    expect(page.locator).toHaveBeenCalledWith('#b');
    expect(click).toHaveBeenCalledWith({ button: 'left', clickCount: 2, timeout: 2500 });

    expect(page.locator).toHaveBeenCalledWith('#c');
    expect(click).toHaveBeenCalledWith({ button: 'right', clickCount: 1, timeout: 2500 });
  });

  it('holds keys while performing the action and releases in reverse order', async () => {
    const hover = vi.fn();
    const click = vi.fn();
    const locator: Locator = { hover, click } as any;

    const down = vi.fn();
    const up = vi.fn();

    const page = { locator: vi.fn().mockReturnValue(locator), keyboard: { down, up } } as any;

    const feature = `
      Feature: Mouse with keys
        Scenario: with modifiers
          When I click the #x while holding 'Alt+Shift+K'
    `;

    await runner.run(feature, { page } as any);

    expect(down.mock.calls.map(c => c[0])).toEqual(['Alt', 'Shift', 'K']);
    expect(click).toHaveBeenCalledWith({ button: 'left', clickCount: 1, timeout: 2500 });
    expect(up.mock.calls.map(c => c[0])).toEqual(['K', 'Shift', 'Alt']);
  });

  it('scrolls locator into view with timeout 2500', async () => {
    const scrollIntoViewIfNeeded = vi.fn();
    const locator: Locator = { scrollIntoViewIfNeeded } as any;
    const page = { locator: vi.fn().mockReturnValue(locator) } as any;

    const feature = `
      Feature: Scroll
        Scenario: into view
          When I scroll \`.section\` into view
    `;

    await runner.run(feature, { page } as any);

    expect(page.locator).toHaveBeenCalledWith('.section');
    expect(scrollIntoViewIfNeeded).toHaveBeenCalledWith({ timeout: 2500 });
  });
});
