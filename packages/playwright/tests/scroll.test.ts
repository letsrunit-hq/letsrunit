import type { Locator } from '@playwright/test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollToCenter } from '../src/scroll';

afterEach(() => vi.restoreAllMocks());

describe('scrollToCenter', () => {
  it('does not call evaluate when locator count is 0', async () => {
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const locator = {
      count: vi.fn().mockResolvedValue(0),
      evaluate,
    } as unknown as Locator;

    await scrollToCenter(locator);

    expect(evaluate).not.toHaveBeenCalled();
  });

  it('calls evaluate with scrollIntoView options when locator is present', async () => {
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const locator = {
      count: vi.fn().mockResolvedValue(1),
      evaluate,
    } as unknown as Locator;

    await scrollToCenter(locator);

    expect(evaluate).toHaveBeenCalledOnce();

    // Verify the serialized function uses the expected scroll options
    const fn = evaluate.mock.calls[0][0] as (el: Element) => void;
    const scrolled: ScrollIntoViewOptions[] = [];
    const fakeEl = { scrollIntoView: (opts: ScrollIntoViewOptions) => scrolled.push(opts) };
    fn(fakeEl as unknown as Element);

    expect(scrolled[0]).toEqual({ block: 'center', inline: 'center', behavior: 'instant' });
  });
});
