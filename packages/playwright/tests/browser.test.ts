import { describe, expect, it, vi } from 'vitest';
import type { Browser, Page } from '@playwright/test';
import { browse } from '../src';

describe('browse', () => {
  it('creates a context and page', async () => {
    const page = { } as unknown as Page;

    const addInitScriptMock = vi.fn().mockResolvedValue(undefined);
    const newPageMock = vi.fn().mockResolvedValue(page);
    const context = {
      addInitScript: addInitScriptMock,
      newPage: newPageMock,
    };

    const newContextMock = vi.fn().mockResolvedValue(context);
    const browserInstance = {
      newContext: newContextMock,
    } as unknown as Browser;

    const url = 'https://example.com';
    const result = await browse(browserInstance, { baseURL: url });

    expect(newContextMock).toHaveBeenCalledTimes(1);
    expect(newContextMock).toHaveBeenCalledWith({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      baseURL: url,
    });

    expect(addInitScriptMock).toHaveBeenCalledTimes(1);
    expect(addInitScriptMock.mock.calls[0][0]).toBeTypeOf('function');

    expect(newPageMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(page);
  });
});
