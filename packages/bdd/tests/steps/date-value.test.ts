import { parseDateString } from '@letsrunit/utils';
import { describe, expect, it, vi } from 'vitest';
import { set as setStep } from '../../src/steps/form';
import { runStep } from '../helpers';

vi.mock('@letsrunit/playwright', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    locator: vi.fn(async (_page: any, _selector: string) => testLocator),
    setFieldValue: vi.fn(),
  };
});

const testLocator = {};

describe('steps/form (relative dates)', () => {
  it('sets a locator with relative date "date of tomorrow"', async () => {
    const { setFieldValue } = await import('@letsrunit/playwright');
    const page = {} as any;

    await runStep(setStep, 'I set "#dob" to date of tomorrow', { page } as any);
    expect(setFieldValue).toHaveBeenCalledWith(testLocator, expect.any(Date), { timeout: 500 });

    const callDate = (setFieldValue as any).mock.calls[0][1];
    const expectedDate = parseDateString('tomorrow');
    expect(callDate.toDateString()).toBe(expectedDate.toDateString());
  });

  it('sets a locator with "date today"', async () => {
    const { setFieldValue } = await import('@letsrunit/playwright');
    const page = {} as any;

    await runStep(setStep, 'I set "#dob" to date today', { page } as any);
    expect(setFieldValue).toHaveBeenLastCalledWith(testLocator, expect.any(Date), { timeout: 500 });

    const callDate = (setFieldValue as any).mock.calls.at(-1)[1];
    const expectedDate = parseDateString('today');
    expect(callDate.toDateString()).toBe(expectedDate.toDateString());
  });

  it('sets a locator with "date 2 days ago"', async () => {
    const { setFieldValue } = await import('@letsrunit/playwright');
    const page = {} as any;

    await runStep(setStep, 'I set "#dob" to date 2 days ago', { page } as any);
    expect(setFieldValue).toHaveBeenLastCalledWith(testLocator, expect.any(Date), { timeout: 500 });

    const callDate = (setFieldValue as any).mock.calls.at(-1)[1];
    const expectedDate = parseDateString('2 days ago');
    expect(callDate.toDateString()).toBe(expectedDate.toDateString());
  });
});
