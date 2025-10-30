import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest';
import { runner } from '../../../src/runner';
import '../../../src/runner/parameters';

vi.mock('../../../src/playwright/wait', () => ({
  waitForIdle: vi.fn(async () => {}),
}));

vi.mock('../../../src/utils/get-lang', () => ({
  getLang: vi.fn(async () => 'en'),
}));

vi.mock('../../../src/playwright/suppress-interferences', () => ({
  suppressInterferences: vi.fn(async () => {}),
}));

import { waitForIdle } from '../../../src/playwright/wait';
import { getLang } from '../../../src/utils/get-lang';
import { suppressInterferences } from '../../../src/playwright/suppress-interferences';
import '../../../src/runner/steps/navigation';

function makePage(initialPath: string) {
  let current = `https://site.test${initialPath}`;
  return {
    url: vi.fn(() => current),
    goto: vi.fn(async (p: string) => {
      current = `https://site.test${p}`;
    }),
    waitForLoadState: vi.fn(async () => {}),
    content: vi.fn(async () => '<html></html>'),
  } as any;
}

describe('steps/navigation (runner)', () => {
  afterAll(() => runner.reset());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Given I'm on the homepage: navigates when not already there and sets lang if unset", async () => {
    const page = makePage('/about');
    const world: any = { page };

    const feature = `
      Feature: Nav home
        Scenario: go home
          Given I'm on the homepage
    `;

    await runner.run(feature, world);

    expect(page.goto).toHaveBeenCalledWith('/');
    expect(waitForIdle).toHaveBeenCalled();
    expect(getLang).toHaveBeenCalled();
    expect(world.lang).toBe('en');
  });

  it("Given I'm on the homepage: does not reload when already there", async () => {
    const page = makePage('/');

    const feature = `
      Feature: Nav stay
        Scenario: already home
          Given I'm on the homepage
    `;

    await runner.run(feature, { page } as any);

    expect(page.goto).not.toHaveBeenCalled();
    expect(waitForIdle).not.toHaveBeenCalled();
  });

  it("Given I'm on page {string}: navigates to the given path", async () => {
    const page = makePage('/');
    const world: any = { page };

    const feature = `
      Feature: Nav page
        Scenario: go to path
          Given I'm on page "/product/1"
    `;

    await runner.run(feature, world);

    expect(page.goto).toHaveBeenCalledWith('/product/1');
    expect(waitForIdle).toHaveBeenCalled();
    expect(world.lang).toBe('en');
  });

  it('Given all popups are closed: calls suppressInterferences with lang', async () => {
    const page = makePage('/');
    const world: any = { page, lang: 'es' };

    const feature = `
      Feature: Close popups
        Scenario: do it
          Given all popups are closed
    `;

    await runner.run(feature, world);

    expect(suppressInterferences).toHaveBeenCalledWith(page, { lang: 'es' });
  });

  it('Then I should be on page {string}: exact path equality and params {}', async () => {
    const page = makePage('/product/123?ref=a#x');
    const world: any = { page };

    const feature = `
      Feature: Exact path
        Scenario: check
          Then I should be on page "/product/123?ref=a#x"
    `;

    await runner.run(feature, world);

    expect(page.waitForLoadState).toHaveBeenCalledWith('load');
    expect(world.params).toEqual({});
  });

  it('Then I should be on page {string}: pattern "/product/:id" extracts id', async () => {
    const page = makePage('/product/42');
    const world: any = { page };

    const feature = `
      Feature: Pattern path
        Scenario: check param
          Then I should be on page "/product/:id"
    `;

    await runner.run(feature, world);

    expect(world.params).toEqual({ id: '42' });
  });

  it('Then I should be on page {string}: mismatch rejects', async () => {
    const page = makePage('/product');

    const feature = `
      Feature: Mismatch
        Scenario: fail
          Then I should be on page "/product/:id"
    `;

    await expect(runner.run(feature, { page } as any)).rejects.toBeTruthy();
  });
});
