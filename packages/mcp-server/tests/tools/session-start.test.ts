import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerSessionStart } from '../../src/tools/session-start';
import { captureHandler, makeSession, makeSessionManager, parseResult } from '../_helpers';

describe('registerSessionStart', () => {
  const session = makeSession();
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    sessions = makeSessionManager({ create: vi.fn().mockResolvedValue(session) });
    call = captureHandler(registerSessionStart, sessions);
  });

  it('returns the sessionId', async () => {
    const result = parseResult(await call({}));
    expect(result.sessionId).toBe('sess-abc');
  });

  it('calls sessions.create with headless defaulting to true', async () => {
    await call({});
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ headless: true }));
  });

  it('passes headless: false when specified', async () => {
    await call({ headless: false });
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ headless: false }));
  });

  it('passes locale from language option', async () => {
    await call({ language: 'fr' });
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ locale: 'fr' }));
  });

  it('passes viewport when viewportWidth is provided', async () => {
    await call({ viewportWidth: 1920, viewportHeight: 1080 });
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ viewport: { width: 1920, height: 1080 } }),
    );
  });

  it('defaults viewport height to 720 when only width is given', async () => {
    await call({ viewportWidth: 800 });
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ viewport: { width: 800, height: 720 } }),
    );
  });

  it('omits viewport when neither width nor height is provided', async () => {
    await call({});
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ viewport: undefined }),
    );
  });

  it('returns err when sessions.create throws', async () => {
    vi.mocked(sessions.create).mockRejectedValue(new Error('launch failed'));
    const result = await call({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('launch failed');
  });
});
