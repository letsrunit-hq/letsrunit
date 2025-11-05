import { describe, it, expect, vi } from 'vitest';
import { runStep } from '../helpers';
import { fill as fillStep, clear as clearStep, type as typeStep, select as selectStep, check as checkStep, focus as focusStep } from '../../src/steps/form';

vi.mock('@letsrunit/playwright', () => ({
  locator: vi.fn(async (_page: any, _selector: string) => testLocator),
}));

import { locator as resolveLocator } from '@letsrunit/playwright';


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

const testLocator: Locator = {} as any;


describe('steps/form (definitions)', () => {
  it('fills a locator with scalar', async () => {
    const fill = vi.fn();
    (testLocator as any).fill = fill;
    const page = {} as any;

    await runStep(fillStep, 'I fill `#name` with "John"', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#name');
    expect(fill).toHaveBeenCalledWith('John', { timeout: 500 });

    await runStep(fillStep, 'I fill `#age` with 42', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#age');
    expect(fill).toHaveBeenLastCalledWith('42', { timeout: 500 });
  });

  it('clears a locator', async () => {
    const clear = vi.fn();
    (testLocator as any).clear = clear;
    const page = {} as any;

    await runStep(clearStep, 'I clear `#name`', { page } as any);

    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#name');
    expect(clear).toHaveBeenCalledWith({ timeout: 500 });
  });

  it('types into a locator', async () => {
    const pressSequentially = vi.fn();
    (testLocator as any).pressSequentially = pressSequentially;
    const page = {} as any;

    await runStep(typeStep, 'I type "hello" into `#field`', { page } as any);

    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#field');
    expect(pressSequentially).toHaveBeenCalledWith('hello', { delay: 200, timeout: 500 });
  });

  it('selects option by label or value and throws when no option found', async () => {
    const selectOption = vi.fn().mockResolvedValue(['some-value']);
    (testLocator as any).selectOption = selectOption;
    const page = {} as any;

    await runStep(selectStep, 'I select "Chrome" in `#browser`', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#browser');
    expect(selectOption).toHaveBeenCalledWith({ label: 'Chrome', value: 'Chrome' }, { timeout: 5000 });

    // Now simulate no matching option
    selectOption.mockResolvedValueOnce([]);

    await expect(runStep(selectStep, 'I select "Missing" in `#browser`', { page } as any))
      .rejects.toThrowError('Option "Missing" not found in select #browser');
  });

  it('checks and unchecks', async () => {
    const check = vi.fn();
    const uncheck = vi.fn();
    (testLocator as any).check = check;
    (testLocator as any).uncheck = uncheck;
    const page = {} as any;

    await runStep(checkStep, 'I check `#agree`', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#agree');
    expect(check).toHaveBeenCalledWith({ timeout: 500 });

    await runStep(checkStep, 'I uncheck `#agree`', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#agree');
    expect(uncheck).toHaveBeenCalledWith({ timeout: 500 });
  });

  it('focuses and blurs', async () => {
    const focus = vi.fn();
    const blur = vi.fn();
    (testLocator as any).focus = focus;
    (testLocator as any).blur = blur;
    const page = {} as any;

    await runStep(focusStep, 'I focus `#input`', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#input');
    expect(focus).toHaveBeenCalledWith({ timeout: 500 });

    await runStep(focusStep, 'I blur `#input`', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#input');
    expect(blur).toHaveBeenCalledWith({ timeout: 500 });
  });
});
