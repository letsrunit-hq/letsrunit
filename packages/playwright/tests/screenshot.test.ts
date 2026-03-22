// @vitest-environment jsdom
import type { ElementHandle, Locator, Page } from '@playwright/test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screenshot, screenshotElement } from '../src/screenshot';

afterEach(() => vi.restoreAllMocks());

function makeBuffer() {
  return Buffer.from([137, 80, 78, 71]); // PNG magic bytes
}

describe('screenshotElement', () => {
  it('returns a File with image/png MIME type and a hashed filename', async () => {
    const buf = makeBuffer();
    const locatorScreenshot = vi.fn().mockResolvedValue(buf);
    const firstLocator = { screenshot: locatorScreenshot } as unknown as Locator;
    const page = {
      locator: vi.fn().mockReturnValue({ first: () => firstLocator }),
    } as unknown as Page;

    const file = await screenshotElement(page, '.my-element');

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/png');
    expect(file.name).toMatch(/^screenshot-.+\.png$/);
    expect(locatorScreenshot).toHaveBeenCalledOnce();
  });

  it('passes options to the locator screenshot call', async () => {
    const buf = makeBuffer();
    const locatorScreenshot = vi.fn().mockResolvedValue(buf);
    const firstLocator = { screenshot: locatorScreenshot } as unknown as Locator;
    const page = {
      locator: vi.fn().mockReturnValue({ first: () => firstLocator }),
    } as unknown as Page;

    await screenshotElement(page, '.el', { timeout: 5000 });

    expect(locatorScreenshot).toHaveBeenCalledWith({ timeout: 5000 });
  });
});

describe('screenshot', () => {
  it('calls page.screenshot() and returns a File', async () => {
    const buf = makeBuffer();
    const pageScreenshot = vi.fn().mockResolvedValue(buf);
    const page = { screenshot: pageScreenshot } as unknown as Page;

    const file = await screenshot(page);

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/png');
    expect(file.name).toMatch(/^screenshot-.+\.png$/);
    expect(pageScreenshot).toHaveBeenCalledOnce();
  });

  it('calls page.screenshot() without mask option when no mask provided', async () => {
    const buf = makeBuffer();
    const pageScreenshot = vi.fn().mockResolvedValue(buf);
    const page = { screenshot: pageScreenshot } as unknown as Page;

    await screenshot(page, { fullPage: true });

    expect(pageScreenshot).toHaveBeenCalledWith({ fullPage: true });
  });

  it('injects CSS overlay and adds highlight class when mask locators are provided', async () => {
    const buf = makeBuffer();
    const handle = {
      evaluate: vi.fn().mockResolvedValue(undefined),
    } as unknown as ElementHandle;
    const maskLocator = {
      elementHandles: vi.fn().mockResolvedValue([handle]),
    } as unknown as Locator;
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const page = {
      screenshot: vi.fn().mockResolvedValue(buf),
      evaluate,
    } as unknown as Page;

    const file = await screenshot(page, { mask: [maskLocator] });

    expect(file).toBeInstanceOf(File);
    // CSS injection evaluate + cleanup evaluate
    expect(evaluate).toHaveBeenCalledTimes(2);
    // Element handle evaluate called for adding and removing class
    expect(handle.evaluate).toHaveBeenCalledTimes(2);
  });

  it('still runs cleanup evaluate in finally even when screenshot throws', async () => {
    const handle = {
      evaluate: vi.fn().mockResolvedValue(undefined),
    } as unknown as ElementHandle;
    const maskLocator = {
      elementHandles: vi.fn().mockResolvedValue([handle]),
    } as unknown as Locator;
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const page = {
      screenshot: vi.fn().mockRejectedValue(new Error('screenshot failed')),
      evaluate,
    } as unknown as Page;

    await expect(screenshot(page, { mask: [maskLocator] })).rejects.toThrow('screenshot failed');

    // Cleanup must have run in finally
    expect(evaluate).toHaveBeenCalledTimes(2);
    expect(handle.evaluate).toHaveBeenCalledTimes(2);
  });

  it('executes CSS injection and cleanup callbacks with real DOM (jsdom)', async () => {
    const buf = makeBuffer();

    // Make a real DOM element to use as the "handle"
    const el = document.createElement('div');
    document.body.appendChild(el);

    const handle = {
      // Actually execute the evaluate callback on the real DOM element
      evaluate: vi.fn().mockImplementation(async (fn: Function) => fn(el)),
    } as unknown as ElementHandle;

    const maskLocator = {
      elementHandles: vi.fn().mockResolvedValue([handle]),
    } as unknown as Locator;

    // Execute page.evaluate callbacks against the real jsdom document
    const page = {
      screenshot: vi.fn().mockResolvedValue(buf),
      evaluate: vi.fn().mockImplementation(async (fn: Function) => fn()),
    } as unknown as Page;

    const file = await screenshot(page, { mask: [maskLocator] });

    expect(file).toBeInstanceOf(File);
    // Cleanup evaluate ran and removed both elements
    expect(document.getElementById('lri-mask-style')).toBeNull();
    expect(document.getElementById('lri-mask-overlay')).toBeNull();
    // Handle evaluate was called twice (add class + remove class)
    expect(handle.evaluate).toHaveBeenCalledTimes(2);

    document.body.removeChild(el);
  });
});
