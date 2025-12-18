import { suppressInterferences, waitForIdle } from '@letsrunit/playwright';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertPath, back, navHome, navPath, popupClosed } from '../../src/steps/navigation';
import { getLang } from '../../src/utils/get-lang';
import { runStep } from '../helpers';

vi.mock('@letsrunit/playwright', () => ({
  waitForIdle: vi.fn(async () => {}),
  suppressInterferences: vi.fn(async () => {}),
}));

vi.mock('../../src/utils/get-lang', () => ({
  getLang: vi.fn(async () => ({ code: 'en' })),
}));

vi.mock('@letsrunit/utils', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    eventually: async (fn: any) => {
      await fn();
    },
  };
});

function makePage(initialPath: string) {
  let current = `https://site.test${initialPath}`;
  return {
    url: vi.fn(() => current),
    goto: vi.fn(async (p: string) => {
      current = `https://site.test${p}`;
      return { status: () => 200 } as any;
    }),
    waitForLoadState: vi.fn(async () => {}),
    content: vi.fn(async () => '<html lang="en"></html>'),
  } as any;
}

describe('steps/navigation (definitions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Given I'm on the homepage: navigates when not already there and sets lang if unset", async () => {
    const page = makePage('/about');
    const world: any = { page };

    await runStep(navHome, "I'm on the homepage", world);

    expect(page.goto).toHaveBeenCalledWith('/');
    expect(waitForIdle).toHaveBeenCalled();
    expect(getLang).toHaveBeenCalled();
    expect(world.lang).toEqual({ code: 'en' });
  });

  it("Given I'm on the homepage: navigates (reloads) even when already there", async () => {
    const page = makePage('/');

    await runStep(navHome, "I'm on the homepage", { page } as any);

    expect(page.goto).toHaveBeenCalledWith('/');
    expect(waitForIdle).toHaveBeenCalled();
  });

  it("Given I'm on page {string}: navigates to the given path", async () => {
    const page = makePage('/');
    const world: any = { page };

    await runStep(navPath, 'I\'m on page "/product/1"', world);

    expect(page.goto).toHaveBeenCalledWith('/product/1');
    expect(waitForIdle).toHaveBeenCalled();
    expect(world.lang).toEqual({ code: 'en' });
  });

  it('Given all popups are closed: calls suppressInterferences with lang', async () => {
    const page = makePage('/');
    const world: any = { page, lang: { code: 'es' } };

    await runStep(popupClosed, 'all popups are closed', world);

    expect(suppressInterferences).toHaveBeenCalledWith(page, { lang: 'es' });
  });

  it('Then I should be on page {string}: exact path equality and params {}', async () => {
    const page = makePage('/product/123?ref=a#x');
    const world: any = { page };

    await runStep(assertPath, 'I should be on page "/product/123?ref=a#x"', world);

    expect(world.pathParams).toBeUndefined();
  });

  it('Then I should be on page {string}: pattern "/product/:id" extracts id', async () => {
    const page = makePage('/product/42');
    const world: any = { page };

    await runStep(assertPath, 'I should be on page "/product/:id"', world);

    expect(world.pathParams).toEqual({ id: '42' });
  });

  it('Then I should be on page {string}: mismatch rejects', async () => {
    const page = makePage('/product');

    await expect(runStep(assertPath, 'I should be on page "/product/:id"', { page } as any)).rejects.toBeTruthy();
  });

  it('When I go back to the previous page: calls page.goBack then waitForIdle', async () => {
    const page = makePage('/a');
    const goBack = vi.fn(async () => {});
    (page as any).goBack = goBack;

    await runStep(back, 'I go back to the previous page', { page } as any);

    expect(goBack).toHaveBeenCalled();
    expect(waitForIdle).toHaveBeenCalledWith(page);
  });
});
