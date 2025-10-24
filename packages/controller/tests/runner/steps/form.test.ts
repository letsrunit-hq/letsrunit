import { describe, it, expect, afterAll, vi } from 'vitest';
import { runner } from '../../../src/runner';
import '../../../src/runner/parameters';
import '../../../src/runner/steps/form';


type Locator = {
  fill?: (value: string, opts: { timeout: number }) => Promise<void>;
  clear?: (opts: { timeout: number }) => Promise<void>;
  pressSequentially?: (value: string, opts: { delay: number; timeout: number }) => Promise<void>;
  selectOption?: (
    option: { label: string; value: string },
    opts: { timeout: number },
  ) => Promise<string[]>;
  check?: (opts: { timeout: number }) => Promise<void>;
  uncheck?: (opts: { timeout: number }) => Promise<void>;
  focus?: (opts: { timeout: number }) => Promise<void>;
  blur?: (opts: { timeout: number }) => Promise<void>;
};


describe('steps/form', () => {
  afterAll(() => runner.reset());

  it('fills a locator with scalar', async () => {
    const fill = vi.fn();
    const locator: Locator = { fill } as any;
    const page = { locator: vi.fn().mockReturnValue(locator) } as any;

    const feature = `
      Feature: Form fill
        Scenario: fill
          When I fill #name with "John"
          And I fill #age with 42
    `;

    await runner.run(feature, { page } as any);

    expect(page.locator).toHaveBeenCalledWith('#name');
    expect(fill).toHaveBeenCalledWith('John', { timeout: 2500 });
    expect(page.locator).toHaveBeenCalledWith('#age');
    expect(fill).toHaveBeenLastCalledWith('42', { timeout: 2500 });
  });

  it('clears a locator', async () => {
    const clear = vi.fn();
    const locator: Locator = { clear } as any;
    const page = { locator: vi.fn().mockReturnValue(locator) } as any;

    const feature = `
      Feature: Form clear
        Scenario: clear
          When I clear #name
    `;

    await runner.run(feature, { page } as any);

    expect(page.locator).toHaveBeenCalledWith('#name');
    expect(clear).toHaveBeenCalledWith({ timeout: 2500 });
  });

  it('types into a locator', async () => {
    const pressSequentially = vi.fn();
    const locator: Locator = { pressSequentially } as any;
    const page = { locator: vi.fn().mockReturnValue(locator) } as any;

    const feature = `
      Feature: Form type
        Scenario: type
          When I type "hello" into #field
    `;

    await runner.run(feature, { page } as any);

    expect(page.locator).toHaveBeenCalledWith('#field');
    expect(pressSequentially).toHaveBeenCalledWith('hello', { delay: 200, timeout: 2500 });
  });

  it('selects option by label or value and throws when no option found', async () => {
    const selectOption = vi.fn().mockResolvedValue(['some-value']);
    const locator: Locator = { selectOption } as any;
    const page = { locator: vi.fn().mockReturnValue(locator) } as any;

    const feature = `
      Feature: Select
        Scenario: pick existing
          When I select "Chrome" in #browser
    `;

    await runner.run(feature, { page } as any);
    expect(page.locator).toHaveBeenCalledWith('#browser');
    expect(selectOption).toHaveBeenCalledWith({ label: 'Chrome', value: 'Chrome' }, { timeout: 5000 });

    // Now simulate no matching option
    selectOption.mockResolvedValueOnce([]);

    const failingFeature = `
      Feature: Select missing
        Scenario: not found
          When I select "Missing" in #browser
    `;

    await expect(runner.run(failingFeature, { page } as any))
      .rejects.toThrowError('Option "Missing" not found in select #browser');
  });

  it('checks and unchecks', async () => {
    const check = vi.fn();
    const uncheck = vi.fn();
    const locator: Locator = { check, uncheck } as any;
    const page = { locator: vi.fn().mockReturnValue(locator) } as any;

    const feature = `
      Feature: Check
        Scenario: check
          When I check #agree
          And I uncheck #agree
    `;

    await runner.run(feature, { page } as any);

    expect(page.locator).toHaveBeenCalledWith('#agree');
    expect(check).toHaveBeenCalledWith({ timeout: 2500 });
    expect(uncheck).toHaveBeenCalledWith({ timeout: 2500 });
  });

  it('focuses and blurs', async () => {
    const focus = vi.fn();
    const blur = vi.fn();
    const locator: Locator = { focus, blur } as any;
    const page = { locator: vi.fn().mockReturnValue(locator) } as any;

    const feature = `
      Feature: Focus
        Scenario: focus blur
          When I focus #input
          And I blur #input
    `;

    await runner.run(feature, { page } as any);

    expect(page.locator).toHaveBeenCalledWith('#input');
    expect(focus).toHaveBeenCalledWith({ timeout: 2500 });
    expect(blur).toHaveBeenCalledWith({ timeout: 2500 });
  });
});
