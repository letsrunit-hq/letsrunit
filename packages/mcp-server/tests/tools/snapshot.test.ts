import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@letsrunit/playwright', () => ({
  scrubHtml: vi.fn().mockResolvedValue('<p>clean html</p>'),
}));

import { scrubHtml } from '@letsrunit/playwright';
import { registerSnapshot } from '../../src/tools/snapshot';
import { captureHandler, makeSession, makeSessionManager, parseResult } from '../_helpers';

describe('registerSnapshot', () => {
  let session: ReturnType<typeof makeSession>;
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    session = makeSession();
    sessions = makeSessionManager({ get: vi.fn().mockReturnValue(session) });
    call = captureHandler(registerSnapshot, sessions);
    vi.clearAllMocks();
    vi.mocked(scrubHtml).mockResolvedValue('<p>clean html</p>');
  });

  it('calls sessions.get and touch', async () => {
    await call({ sessionId: 'sess-abc' });
    expect(sessions.get).toHaveBeenCalledWith('sess-abc');
    expect(sessions.touch).toHaveBeenCalledWith('sess-abc');
  });

  it('passes the page to scrubHtml when no selector', async () => {
    await call({ sessionId: 'sess-abc' });
    expect(scrubHtml).toHaveBeenCalledWith(session.controller.page, expect.any(Object));
  });

  it('passes element outerHTML to scrubHtml when selector is provided', async () => {
    const outerHtml = '<div id="app">content</div>';
    vi.mocked(session.controller.page.locator('').first().evaluate as any).mockResolvedValue(outerHtml);
    session.controller.page.locator = vi.fn().mockReturnValue({
      first: vi.fn().mockReturnValue({
        evaluate: vi.fn().mockResolvedValue(outerHtml),
      }),
    });

    await call({ sessionId: 'sess-abc', selector: '#app' });

    expect(scrubHtml).toHaveBeenCalledWith(
      expect.objectContaining({ html: outerHtml }),
      expect.any(Object),
    );
  });

  it('passes scrub options through to scrubHtml', async () => {
    await call({ sessionId: 'sess-abc', dropHidden: false, pickMain: true, stripAttributes: 2 });
    expect(scrubHtml).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ dropHidden: false, pickMain: true, stripAttributes: 2 }),
    );
  });

  it('returns url and html in response', async () => {
    const result = parseResult(await call({ sessionId: 'sess-abc' }));
    expect(result.url).toBe('http://example.com');
    expect(result.html).toBe('<p>clean html</p>');
  });

  it('returns err when sessions.get throws', async () => {
    vi.mocked(sessions.get).mockImplementation(() => { throw new Error('Session not found: x'); });
    const result = await call({ sessionId: 'x' });
    expect(result.isError).toBe(true);
  });
});
