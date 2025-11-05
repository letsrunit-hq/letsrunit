import { describe, it, expect, vi, afterEach } from 'vitest';
import { runStep } from '../helpers';
import { see, contain } from '../../src/steps/assert';

vi.mock('@letsrunit/playwright', () => ({
  locator: vi.fn(async (_page: any, selector: string) => {
    if (selector === '#list' || selector === '.cards') return parentLocatorMock;
    return elementLocatorMock;
  }),
}));

const toBeVisible = vi.fn();
const toBeAttached = vi.fn();

vi.mock('../../src/utils/test-helpers', () => {
  return {
    expectOrNot: vi.fn((_actual: any, _toBe: boolean) => {
      return {
        toBeVisible: (...args: any[]) => toBeVisible(...args),
        toBeAttached: (...args: any[]) => toBeAttached(...args),
      };
    }),
    __esModule: true,
  } as any;
});

import { locator as resolveLocator } from '@letsrunit/playwright';
import { expectOrNot } from '../../src/utils/test-helpers';

type Locator = { locator?: (s: string) => any };

afterEach(() => {
  vi.clearAllMocks();
});

const elementLocatorMock: any = {};
const childLocatorMock: any = {};
const parentLocatorMock: Locator = { locator: vi.fn().mockReturnValue(childLocatorMock) };

describe('steps/assert (definitions)', () => {
  it('waits for element to be visible or hidden with timeout 5000', async () => {
    const page = {} as any;

    await runStep(see, 'I see `#thing`', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '#thing');
    expect(toBeVisible).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(elementLocatorMock, true);

    await runStep(see, 'I dont see `.item`', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '.item');
    expect(toBeVisible).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(elementLocatorMock, false);
  });

  it('waits for child attachment or detachment with timeout 5000', async () => {
    const page = {} as any;

    await runStep(contain, 'I see that `#list` contains text "foo"', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '#list');
    expect(parentLocatorMock.locator).toHaveBeenLastCalledWith('text="foo"i');
    expect(toBeAttached).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(childLocatorMock, true);

    await runStep(contain, 'I see that `.cards` not contains `.card`', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '.cards');
    expect(parentLocatorMock.locator).toHaveBeenLastCalledWith('.card');
    expect(toBeAttached).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(childLocatorMock, false);
  });
});
