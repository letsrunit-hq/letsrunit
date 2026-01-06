import { locator as resolveLocator } from '@letsrunit/playwright';
import { describe, expect, it, vi } from 'vitest';
import { check as checkStep, clear as clearStep, focus as focusStep, set as setStep } from '../../src/steps/form';
import { type as typeStep } from '../../src/steps/keyboard';
import { runStep } from '../helpers';

vi.mock('@letsrunit/playwright', () => ({
  locator: vi.fn(async (_page: any, _selector: string) => testLocator),
}));

type Locator = {
  fill?: (value: string, opts: { timeout: number }) => Promise<void>;
  clear?: (opts: { timeout: number }) => Promise<void>;
  pressSequentially?: (value: string, opts: { delay: number; timeout: number }) => Promise<void>;
  selectOption?: (option: { label: string; value: string }, opts: { timeout: number }) => Promise<string[]>;
  check?: (opts: { timeout: number }) => Promise<void>;
  uncheck?: (opts: { timeout: number }) => Promise<void>;
  focus?: (opts: { timeout: number }) => Promise<void>;
  blur?: (opts: { timeout: number }) => Promise<void>;
  getAttribute?: (name: string) => Promise<string | null>;
};

const testLocator: Locator = {} as any;

describe('steps/form (definitions)', () => {
  it('sets a locator with scalar', async () => {
    const fill = vi.fn();
    const evaluate = vi.fn().mockResolvedValue('INPUT');
    const getAttribute = vi.fn().mockResolvedValue(null);
    (testLocator as any).fill = fill;
    (testLocator as any).evaluate = evaluate;
    (testLocator as any).getAttribute = getAttribute;
    const page = {} as any;

    await runStep(setStep, 'I set `#name` to "John"', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#name');
    expect(fill).toHaveBeenCalledWith('John', { timeout: 500 });

    await runStep(setStep, 'I set `#age` to 42', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#age');
    expect(fill).toHaveBeenLastCalledWith('42', { timeout: 500 });

    const date = new Date('2024-03-20T15:30:00Z');
    await runStep(setStep, 'I set `#dob` to date "2024-03-20"', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#dob');
    expect(fill).toHaveBeenLastCalledWith('2024-03-20', { timeout: 500 });

    // datetime-local
    getAttribute.mockResolvedValueOnce('datetime-local');
    await runStep(setStep, 'I set `#dt` to date "2024-03-20T15:30"', { page } as any);
    expect(fill).toHaveBeenLastCalledWith('2024-03-20T15:30', { timeout: 500 });

    // month
    getAttribute.mockResolvedValueOnce('month');
    await runStep(setStep, 'I set `#month` to date "2024-03-20"', { page } as any);
    expect(fill).toHaveBeenLastCalledWith('2024-03', { timeout: 500 });

    // week - 2024-03-20 is a Wednesday in Week 12
    getAttribute.mockResolvedValueOnce('week');
    await runStep(setStep, 'I set `#week` to date "2024-03-20"', { page } as any);
    expect(fill).toHaveBeenLastCalledWith('2024-W12', { timeout: 500 });

    // time
    getAttribute.mockResolvedValueOnce('time');
    await runStep(setStep, 'I set `#time` to date "2024-03-20T15:30"', { page } as any);
    expect(fill).toHaveBeenLastCalledWith('15:30', { timeout: 500 });

    // date (explicit)
    getAttribute.mockResolvedValueOnce('date');
    await runStep(setStep, 'I set `#date` to date "2024-03-20"', { page } as any);
    expect(fill).toHaveBeenLastCalledWith('2024-03-20', { timeout: 500 });

    // getAttribute fails
    getAttribute.mockRejectedValueOnce(new Error('fail'));
    await runStep(setStep, 'I set `#fail` to date "2024-03-20"', { page } as any);
    expect(fill).toHaveBeenLastCalledWith('2024-03-20', { timeout: 500 });
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
    const type = vi.fn();
    (testLocator as any).type = type;
    const page = { keyboard: { type } } as any;

    await runStep(typeStep, 'I type "hello"', { page } as any);

    expect(type).toHaveBeenCalledWith('hello', { delay: 200, timeout: 500 });
  });

  it('sets a select option', async () => {
    const selectOption = vi.fn().mockResolvedValue(['some-value']);
    const evaluate = vi.fn().mockResolvedValue('SELECT');
    (testLocator as any).selectOption = selectOption;
    (testLocator as any).evaluate = evaluate;
    const page = {} as any;

    await runStep(setStep, 'I set `#browser` to "Chrome"', { page } as any);
    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#browser');
    expect(evaluate).toHaveBeenCalled();
    expect(selectOption).toHaveBeenCalledWith({ label: 'Chrome', value: 'Chrome' }, { timeout: 5000 });

    // Now simulate no matching option
    selectOption.mockResolvedValueOnce([]);

    await expect(runStep(setStep, 'I set `#browser` to "Missing"', { page } as any)).rejects.toThrowError(
      'Option "Missing" not found in select #browser',
    );
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
