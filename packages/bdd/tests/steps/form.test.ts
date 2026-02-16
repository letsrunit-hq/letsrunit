import { locator as resolveLocator } from '@letsrunit/playwright';
import { describe, expect, it, vi } from 'vitest';
import { check as checkStep, clear as clearStep, focus as focusStep, set as setStep } from '../../src/steps/form';
import { type as typeStep } from '../../src/steps/keyboard';
import { runStep } from '../helpers';

vi.mock('@letsrunit/playwright', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    locator: vi.fn(async (_page: any, _selector: string) => testLocator),
    setFieldValue: vi.fn(),
  };
});

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
    const { setFieldValue } = await import('@letsrunit/playwright');
    const page = {} as any;

    await runStep(setStep, 'I set `#name` to "John"', { page } as any);
    expect(setFieldValue).toHaveBeenCalledWith(testLocator, 'John', { timeout: 500 });

    await runStep(setStep, 'I set `#age` to 42', { page } as any);
    expect(setFieldValue).toHaveBeenLastCalledWith(testLocator, 42, { timeout: 500 });

    await runStep(setStep, 'I set `#dob` to date "2024-03-20"', { page } as any);
    expect(setFieldValue).toHaveBeenLastCalledWith(testLocator, expect.any(Date), { timeout: 500 });
  });

  it('clears a locator', async () => {
    const { setFieldValue } = await import('@letsrunit/playwright');
    const page = {} as any;

    await runStep(clearStep, 'I clear `#name`', { page } as any);

    expect(setFieldValue).toHaveBeenCalledWith(testLocator, null, { timeout: 500 });
  });

  it('types into a locator', async () => {
    const type = vi.fn();
    (testLocator as any).type = type;
    const page = { keyboard: { type } } as any;

    await runStep(typeStep, 'I type "hello"', { page } as any);

    expect(type).toHaveBeenCalledWith('hello', { delay: 200 });
  });

  it('sets a select option', async () => {
    const { setFieldValue } = await import('@letsrunit/playwright');
    const page = {} as any;

    await runStep(setStep, 'I set `#browser` to "Chrome"', { page } as any);
    expect(setFieldValue).toHaveBeenCalledWith(testLocator, 'Chrome', { timeout: 500 });
  });

  it('checks and unchecks', async () => {
    const { setFieldValue } = await import('@letsrunit/playwright');
    const page = {} as any;

    await runStep(checkStep, 'I check `#agree`', { page } as any);
    expect(setFieldValue).toHaveBeenCalledWith(testLocator, true, { timeout: 500 });

    await runStep(checkStep, 'I uncheck `#agree`', { page } as any);
    expect(setFieldValue).toHaveBeenLastCalledWith(testLocator, false, { timeout: 500 });
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
