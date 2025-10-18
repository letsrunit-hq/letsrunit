import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Browser as BrowserType, Page as PageType } from '@playwright/test';

const launchMock = vi.fn();
const waitForIdleMock = vi.fn();

vi.mock('playwright', () => ({
  chromium: {
    launch: launchMock,
  },
}));

vi.mock('@playwright/test', () => ({
  Browser: class {},
  Page: class {},
}));

vi.mock('../src/wait', () => ({
  waitForIdle: waitForIdleMock,
}));

import { browse, close, launch } from '../src/browser';

describe('browser', () => {
  beforeEach(() => {
    launchMock.mockReset();
    waitForIdleMock.mockReset();
  });

  describe('launch', () => {
    it('launches chromium in headless mode', async () => {
      const browserInstance = { close: vi.fn() };
      launchMock.mockResolvedValue(browserInstance);

      const result = await launch();

      expect(launchMock).toHaveBeenCalledTimes(1);
      expect(launchMock).toHaveBeenCalledWith({ headless: true });
      expect(result).toBe(browserInstance);
    });
  });

  describe('close', () => {
    it('invokes browser.close', async () => {
      const closeMock = vi.fn().mockResolvedValue(undefined);
      const browserInstance = { close: closeMock } as unknown as BrowserType;

      await close(browserInstance);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('browse', () => {
    it('creates a context, navigates to the url, and waits for idle', async () => {
      const gotoMock = vi.fn().mockResolvedValue(undefined);
      const page = { goto: gotoMock } as unknown as PageType;

      const addInitScriptMock = vi.fn().mockResolvedValue(undefined);
      const newPageMock = vi.fn().mockResolvedValue(page);
      const context = {
        addInitScript: addInitScriptMock,
        newPage: newPageMock,
      };

      const newContextMock = vi.fn().mockResolvedValue(context);
      const browserInstance = {
        newContext: newContextMock,
      } as unknown as BrowserType;

      waitForIdleMock.mockResolvedValue(undefined);

      const url = 'https://example.com';
      const result = await browse(browserInstance, url);

      expect(newContextMock).toHaveBeenCalledTimes(1);
      expect(newContextMock).toHaveBeenCalledWith({
        viewport: { width: 1920, height: 1080 },
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US',
      });

      expect(addInitScriptMock).toHaveBeenCalledTimes(1);
      expect(addInitScriptMock.mock.calls[0][0]).toBeTypeOf('function');

      expect(newPageMock).toHaveBeenCalledTimes(1);
      expect(gotoMock).toHaveBeenCalledWith(url);
      expect(waitForIdleMock).toHaveBeenCalledWith(page);
      expect(result).toBe(page);
    });
  });
});
