import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setFieldValue } from '../../src/field/index';

function makeEmptyLocator() {
  const loc: any = {
    count: vi.fn().mockResolvedValue(0),
    check: vi.fn().mockResolvedValue(undefined),
    uncheck: vi.fn().mockResolvedValue(undefined),
    all: vi.fn().mockResolvedValue([]),
    nth: vi.fn().mockReturnThis(),
    first: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    getAttribute: vi.fn().mockResolvedValue(null),
    textContent: vi.fn().mockResolvedValue(''),
    click: vi.fn().mockResolvedValue(undefined),
    isChecked: vi.fn().mockResolvedValue(false),
    scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
    boundingBox: vi.fn().mockResolvedValue(null),
    focus: vi.fn().mockResolvedValue(undefined),
  };
  loc.locator = vi.fn().mockReturnValue(loc);
  loc.getByRole = vi.fn().mockReturnValue(loc);
  return loc;
}

function makeMockEl(tag: string, type: string | null): Locator {
  const emptyLoc = makeEmptyLocator();
  const el: any = {
    count: vi.fn().mockResolvedValue(1),
    evaluate: vi.fn().mockResolvedValue(tag),
    getAttribute: vi.fn().mockImplementation(async (attr: string) => {
      if (attr === 'type') return type;
      return null;
    }),
    fill: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn().mockReturnValue(emptyLoc),
    getByRole: vi.fn().mockReturnValue(emptyLoc),
    getByLabel: vi.fn().mockReturnValue({ locator: vi.fn().mockReturnValue(emptyLoc) }),
    page: vi.fn().mockReturnValue({ locator: vi.fn().mockReturnValue(emptyLoc) }),
  };
  return el as unknown as Locator;
}

describe('setFieldValue', () => {
  it('fills a text input via setNativeInput', async () => {
    const el = makeMockEl('input', 'text');
    await setFieldValue(el, 'hello');
    expect((el as any).fill).toHaveBeenCalledWith('hello', undefined);
  });

  it('uses setFallback (fill) when no handler matches (div tag)', async () => {
    const el = makeMockEl('div', null);
    await setFieldValue(el, 'hello');
    // setFallback calls el.fill with toString(value) = 'hello'
    expect((el as any).fill).toHaveBeenCalledWith('hello', undefined);
  });

  it('uses setFallback with array value, joining with newline', async () => {
    const el = makeMockEl('div', null);
    await setFieldValue(el, ['a', 'b', 'c']);
    expect((el as any).fill).toHaveBeenCalledWith('a\nb\nc', undefined);
  });

  it('uses setFallback with range value, formatting as "from - to"', async () => {
    const el = makeMockEl('div', null);
    await setFieldValue(el, { from: 1, to: 5 });
    expect((el as any).fill).toHaveBeenCalledWith('1 - 5', undefined);
  });
});
