import { locator as resolveLocator } from '@letsrunit/playwright';
import { describe, expect, it, vi } from 'vitest';
import { copy as copyStep, paste as pasteStep } from '../../src/steps/clipboard';
import { runStep } from '../helpers';

vi.mock('@letsrunit/playwright', () => ({
  locator: vi.fn(async (_page: any, _selector: string) => testLocator),
}));

type Locator = {
  inputValue?: () => Promise<string>;
  getAttribute?: (name: string) => Promise<string | null>;
  evaluate?: <R>(fn: (n: Element) => R) => Promise<R>;
  textContent?: () => Promise<string | null>;
  fill?: (value: string, opts: { timeout: number }) => Promise<void>;
};

const testLocator: Locator = {} as any;

describe('steps/clipboard (definitions)', () => {
  it('copies input value when element is a form control', async () => {
    const page = {} as any;
    (testLocator as any).inputValue = vi.fn().mockResolvedValue('John');
    // ensure others are undefined so inputValue path is taken
    (testLocator as any).evaluate = undefined;
    (testLocator as any).textContent = undefined;

    const world: any = { page };
    await runStep(copyStep, 'I copy `#name` to the clipboard', world);

    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#name');
    expect(world.clipboard?.value).toBe('John');
  });

  it('copies link href (http)', async () => {
    const page = {} as any;
    (testLocator as any).inputValue = undefined;
    (testLocator as any).evaluate = vi.fn().mockResolvedValue('a');
    (testLocator as any).getAttribute = vi.fn().mockResolvedValue('https://example.com');
    (testLocator as any).textContent = vi.fn().mockResolvedValue('Example');

    const world: any = { page };
    await runStep(copyStep, 'I copy `a[href]` to the clipboard', world);

    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('a[href]');
    expect(world.clipboard?.value).toBe('https://example.com');
  });

  it('copies email address only when href is mailto:', async () => {
    const page = {} as any;
    (testLocator as any).inputValue = undefined;
    (testLocator as any).evaluate = vi.fn().mockResolvedValue('a');
    (testLocator as any).getAttribute = vi.fn().mockResolvedValue('mailto:hello@site.com');
    (testLocator as any).textContent = vi.fn().mockResolvedValue('Email');

    const world: any = { page };
    await runStep(copyStep, 'I copy `a[href]` to the clipboard', world);

    expect(world.clipboard?.value).toBe('hello@site.com');
  });

  it('falls back to text content when not a form control or link', async () => {
    const page = {} as any;
    (testLocator as any).inputValue = undefined;
    (testLocator as any).evaluate = vi.fn().mockResolvedValue('span');
    (testLocator as any).getAttribute = vi.fn().mockResolvedValue(null);
    (testLocator as any).textContent = vi.fn().mockResolvedValue('Hello world');

    const world: any = { page };
    await runStep(copyStep, 'I copy `#message` to the clipboard', world);

    expect(world.clipboard?.value).toBe('Hello world');
  });

  it('pastes clipboard value into a locator', async () => {
    const page = {} as any;
    const fill = vi.fn();
    (testLocator as any).fill = fill;

    const world: any = { page, clipboard: { value: 'PASTED' } };
    await runStep(pasteStep, 'I paste from the clipboard into `#target`', world);

    expect((resolveLocator as any).mock.calls.at(-1)[1]).toBe('#target');
    expect(fill).toHaveBeenCalledWith('PASTED', { timeout: 500 });
  });
});
