import { fuzzyLocator as resolveLocator } from '@letsrunit/playwright';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contain, focused, notFocused, see, visible } from '../../src/steps/assert';
import { expectOrNot } from '../../src/utils/test-helpers';
import { runStep } from '../helpers';

vi.mock('@letsrunit/playwright', () => ({
  fuzzyLocator: vi.fn(async (_page: any, selector: string) => {
    if (selector === '#list' || selector === '.cards') return parentLocatorMock;
    return elementLocatorMock;
  }),
}));

const toBeVisible = vi.fn();
const toBeAttached = vi.fn();
const toBeFocused = vi.fn();

vi.mock('../../src/utils/test-helpers', () => {
  return {
    expectOrNot: vi.fn((_actual: any, _toBe: boolean) => {
      return {
        toBeVisible: (...args: any[]) => toBeVisible(...args),
        toBeAttached: (...args: any[]) => toBeAttached(...args),
        toBeFocused: (...args: any[]) => toBeFocused(...args),
      };
    }),
    __esModule: true,
  } as any;
});

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

    await runStep(see, 'the page contains `#thing`', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '#thing');
    expect(toBeVisible).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(elementLocatorMock, true);

    await runStep(see, 'the page does not contain `.item`', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '.item');
    expect(toBeVisible).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(elementLocatorMock, false);
  });

  it('asserts a locator is visible or hidden with timeout 5000', async () => {
    const page = {} as any;

    await runStep(visible, '`#thing` is visible', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '#thing');
    expect(toBeVisible).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(elementLocatorMock, true);

    await runStep(visible, '`.item` is hidden', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '.item');
    expect(toBeVisible).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(elementLocatorMock, false);
  });

  it('waits for child attachment or detachment with timeout 5000', async () => {
    const page = {} as any;

    await runStep(contain, '`#list` contains text "foo"', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '#list');
    expect(parentLocatorMock.locator).toHaveBeenLastCalledWith('text=/foo/i');
    expect(toBeAttached).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(childLocatorMock, true);

    await runStep(contain, '`.cards` does not contain `.card`', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '.cards');
    expect(parentLocatorMock.locator).toHaveBeenLastCalledWith('.card');
    expect(toBeAttached).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(childLocatorMock, false);
  });

  it('asserts whether a locator has focus with timeout 5000', async () => {
    const page = {} as any;

    await runStep(focused, '`#thing` has focus', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '#thing');
    expect(toBeFocused).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(elementLocatorMock, true);

    await runStep(notFocused, '`.item` does not have focus', { page } as any);
    expect(resolveLocator).toHaveBeenLastCalledWith(page, '.item');
    expect(toBeFocused).toHaveBeenLastCalledWith({ timeout: 5000 });
    expect(expectOrNot).toHaveBeenLastCalledWith(elementLocatorMock, false);
  });
});
