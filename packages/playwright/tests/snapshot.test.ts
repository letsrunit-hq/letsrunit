// @vitest-environment jsdom
import type { Page } from '@playwright/test';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock heavy dependencies so snapshot tests run without real timeouts
vi.mock('@letsrunit/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@letsrunit/utils')>();
  return { ...actual, sleep: vi.fn().mockResolvedValue(undefined) };
});

vi.mock('../src/wait', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/wait')>();
  return { ...actual, waitForDomIdle: vi.fn().mockResolvedValue(undefined) };
});

vi.mock('../src/screenshot', () => ({
  screenshot: vi.fn().mockResolvedValue(new File([], 'screenshot-abc.png', { type: 'image/png' })),
}));

import { sleep } from '@letsrunit/utils';
import { screenshot } from '../src/screenshot';
import { waitForDomIdle } from '../src/wait';
import { snapshot } from '../src/snapshot';

afterEach(() => vi.restoreAllMocks());

function makePage(overrides: Partial<Record<string, any>> = {}): Page {
  return {
    url: vi.fn().mockReturnValue('https://example.com/page'),
    content: vi.fn().mockResolvedValue('<html><body><p>Hello</p></body></html>'),
    evaluate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as Page;
}

describe('snapshot', () => {
  it('returns a Snapshot with url, html, and screenshot', async () => {
    const page = makePage();

    const result = await snapshot(page);

    expect(result.url).toBe('https://example.com/page');
    expect(typeof result.html).toBe('string');
    expect(result.screenshot).toBeInstanceOf(File);
  });

  it('calls sleep(500) before waitForDomIdle', async () => {
    const page = makePage();
    const callOrder: string[] = [];

    (sleep as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('sleep');
    });
    (waitForDomIdle as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('waitForDomIdle');
    });

    await snapshot(page);

    expect(callOrder[0]).toBe('sleep');
    expect(callOrder[1]).toBe('waitForDomIdle');
    expect(sleep).toHaveBeenCalledWith(500);
  });

  it('calls waitForDomIdle with the page', async () => {
    const page = makePage();

    await snapshot(page);

    expect(waitForDomIdle).toHaveBeenCalledWith(page);
  });

  it('calls page.evaluate to mark aria-hidden on hidden elements', async () => {
    const page = makePage();

    await snapshot(page);

    // evaluate is called at least once: aria-hidden walk + finally undo
    expect(page.evaluate as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });

  it('calls screenshot with the page', async () => {
    const page = makePage();

    await snapshot(page);

    expect(screenshot).toHaveBeenCalledWith(page);
  });

  it('calls page.url() to capture the URL', async () => {
    const page = makePage();

    await snapshot(page);

    expect(page.url as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });

  it('strips utility classes from html when dropUtilityClasses is true', async () => {
    const page = makePage({
      content: vi.fn().mockResolvedValue(
        '<html><body><div class="flex p-4 card">Hello</div></body></html>',
      ),
    });

    const result = await snapshot(page, { dropUtilityClasses: true });

    expect(result.html).not.toMatch(/\bflex\b/);
    expect(result.html).not.toMatch(/\bp-4\b/);
    expect(result.html).toContain('card');
  });

  it('strips utility classes from html by default', async () => {
    const page = makePage({
      content: vi.fn().mockResolvedValue(
        '<html><body><div class="flex p-4 card">Hello</div></body></html>',
      ),
    });

    const result = await snapshot(page);

    expect(result.html).not.toMatch(/\bflex\b/);
    expect(result.html).not.toMatch(/\bp-4\b/);
    expect(result.html).toContain('card');
  });

  it('executes aria-hidden marking callback and undo with real DOM elements', async () => {
    // Add elements to jsdom so the walk/isHidden code paths are exercised
    const visible = document.createElement('div');
    const hidden = document.createElement('div');
    hidden.setAttribute('hidden', '');
    const ariaHidden = document.createElement('span');
    ariaHidden.setAttribute('aria-hidden', 'true');
    const inert = document.createElement('section');
    inert.setAttribute('inert', '');
    document.body.append(visible, hidden, ariaHidden, inert);

    const page = makePage({
      evaluate: vi.fn().mockImplementation(async (fn: Function) => fn()),
      content: vi.fn().mockResolvedValue('<html><body></body></html>'),
    });

    await expect(snapshot(page)).resolves.toBeDefined();
    // evaluate called twice: walk + undo
    expect(page.evaluate as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(2);

    document.body.replaceChildren();
  });
});
