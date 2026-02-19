import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@letsrunit/playwright', () => ({
  screenshot: vi.fn(),
  screenshotElement: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

import { screenshot, screenshotElement } from '@letsrunit/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { registerScreenshot } from '../../src/tools/screenshot';
import { captureHandler, makeSession, makeSessionManager, parseResult } from '../_helpers';

const fakeFile = new File([new Uint8Array([1, 2, 3])], 'screenshot-abc123.png', { type: 'image/png' });

describe('registerScreenshot', () => {
  let session: ReturnType<typeof makeSession>;
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    session = makeSession();
    sessions = makeSessionManager({ get: vi.fn().mockReturnValue(session) });
    call = captureHandler(registerScreenshot, sessions);
    vi.clearAllMocks();
    vi.mocked(screenshot).mockResolvedValue(fakeFile);
    vi.mocked(screenshotElement).mockResolvedValue(fakeFile);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);
  });

  it('calls sessions.get and touch', async () => {
    await call({ sessionId: 'sess-abc' });
    expect(sessions.get).toHaveBeenCalledWith('sess-abc');
    expect(sessions.touch).toHaveBeenCalledWith('sess-abc');
  });

  it('uses screenshotElement when selector is provided', async () => {
    await call({ sessionId: 'sess-abc', selector: '#main' });
    expect(screenshotElement).toHaveBeenCalledWith(session.controller.page, '#main');
    expect(screenshot).not.toHaveBeenCalled();
  });

  it('uses screenshot when no selector', async () => {
    await call({ sessionId: 'sess-abc' });
    expect(screenshot).toHaveBeenCalled();
    expect(screenshotElement).not.toHaveBeenCalled();
  });

  it('passes fullPage option to screenshot', async () => {
    await call({ sessionId: 'sess-abc', fullPage: true });
    expect(screenshot).toHaveBeenCalledWith(
      session.controller.page,
      expect.objectContaining({ fullPage: true }),
    );
  });

  it('passes mask locators to screenshot', async () => {
    await call({ sessionId: 'sess-abc', mask: ['.btn', '.link'] });
    expect(screenshot).toHaveBeenCalledWith(
      session.controller.page,
      expect.objectContaining({ mask: expect.any(Array) }),
    );
  });

  it('calls screenshot without mask when mask is empty', async () => {
    await call({ sessionId: 'sess-abc', mask: [] });
    const options = vi.mocked(screenshot).mock.calls[0][1] as any;
    expect(options?.mask).toBeUndefined();
  });

  it('creates the artifact directory and writes the file', async () => {
    await call({ sessionId: 'sess-abc' });
    expect(mkdir).toHaveBeenCalledWith('/artifacts/sess-abc', { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('screenshot-abc123.png'),
      expect.any(Uint8Array),
    );
  });

  it('returns path and mimeType', async () => {
    const result = parseResult(await call({ sessionId: 'sess-abc' }));
    expect(result.path).toContain('screenshot-abc123.png');
    expect(result.mimeType).toBe('image/png');
  });

  it('returns err when sessions.get throws', async () => {
    vi.mocked(sessions.get).mockImplementation(() => { throw new Error('Session not found: x'); });
    const result = await call({ sessionId: 'x' });
    expect(result.isError).toBe(true);
  });
});
