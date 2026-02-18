import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerSessionClose } from '../../src/tools/session-close';
import { captureHandler, makeSessionManager, parseResult } from '../_helpers';

describe('registerSessionClose', () => {
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    sessions = makeSessionManager({ close: vi.fn().mockResolvedValue(undefined) });
    call = captureHandler(registerSessionClose, sessions);
  });

  it('calls sessions.close with the sessionId', async () => {
    await call({ sessionId: 'sess-abc' });
    expect(sessions.close).toHaveBeenCalledWith('sess-abc');
  });

  it('returns { closed: true }', async () => {
    const result = parseResult(await call({ sessionId: 'sess-abc' }));
    expect(result).toEqual({ closed: true });
  });

  it('returns err when sessions.close throws', async () => {
    vi.mocked(sessions.close).mockRejectedValue(new Error('close failed'));
    const result = await call({ sessionId: 'sess-abc' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('close failed');
  });
});
