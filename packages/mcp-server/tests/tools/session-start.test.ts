import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSupportFiles } from '../../src/utility/support';
import { registerSessionStart } from '../../src/tools/session-start';
import { captureHandler, makeSession, makeSessionManager, parseResult } from '../_helpers';

vi.mock('../../src/utility/support', () => ({
  loadSupportFiles: vi.fn().mockResolvedValue(undefined),
}));

describe('registerSessionStart', () => {
  const session = makeSession();
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('LETSRUNIT_MCP_RUNTIME_MODE', 'project');
    sessions = makeSessionManager({ create: vi.fn().mockResolvedValue(session) });
    call = captureHandler(registerSessionStart, sessions);
  });

  it('returns the sessionId', async () => {
    const result = parseResult(await call({}));
    expect(result.sessionId).toBe('sess-abc');
  });

  it('loads support files from cucumber config before session creation', async () => {
    await call({});
    expect(loadSupportFiles).toHaveBeenCalledTimes(1);
  });

  it('does not load support files in standalone mode', async () => {
    vi.stubEnv('LETSRUNIT_MCP_RUNTIME_MODE', 'standalone');
    await call({});
    expect(loadSupportFiles).not.toHaveBeenCalled();
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

  it('defaults viewport width to 1280 when only height is given', async () => {
    await call({ viewportHeight: 900 });
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ viewport: { width: 1280, height: 900 } }),
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
