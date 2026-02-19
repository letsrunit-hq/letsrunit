import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDebug } from '../../src/tools/debug';
import { captureHandler, makeSession, makeSessionManager, parseResult } from '../_helpers';

describe('registerDebug', () => {
  let session: ReturnType<typeof makeSession>;
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    session = makeSession();
    sessions = makeSessionManager({ get: vi.fn().mockReturnValue(session) });
    call = captureHandler(registerDebug, sessions);
  });

  it('calls sessions.get and touch', async () => {
    vi.mocked(session.controller.page.evaluate).mockResolvedValue(42);
    await call({ sessionId: 'sess-abc', script: '1 + 1' });
    expect(sessions.get).toHaveBeenCalledWith('sess-abc');
    expect(sessions.touch).toHaveBeenCalledWith('sess-abc');
  });

  it('evaluates the script on the page and returns result', async () => {
    vi.mocked(session.controller.page.evaluate).mockResolvedValue({ count: 3 });
    const result = parseResult(await call({ sessionId: 'sess-abc', script: 'document.querySelectorAll("a").length' }));
    expect(result.result).toEqual({ count: 3 });
  });

  it('returns result: null with error message when evaluate throws', async () => {
    vi.mocked(session.controller.page.evaluate).mockRejectedValue(new Error('syntax error'));
    const result = parseResult(await call({ sessionId: 'sess-abc', script: '!!!' }));
    expect(result.result).toBeNull();
    expect(result.error).toBe('syntax error');
  });

  it('does not set isError when evaluate throws', async () => {
    vi.mocked(session.controller.page.evaluate).mockRejectedValue(new Error('oops'));
    const raw = await call({ sessionId: 'sess-abc', script: 'bad' });
    expect((raw as any).isError).toBeUndefined();
  });
});
