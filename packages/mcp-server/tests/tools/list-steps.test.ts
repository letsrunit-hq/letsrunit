import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerListSteps } from '../../src/tools/list-steps';
import { captureHandler, makeSession, makeSessionManager, parseResult } from '../_helpers';

describe('registerListSteps', () => {
  let session: ReturnType<typeof makeSession>;
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    session = makeSession();
    sessions = makeSessionManager({ get: vi.fn().mockReturnValue(session) });
    call = captureHandler(registerListSteps, sessions);
  });

  it('lists all steps when type is omitted', async () => {
    vi.mocked(session.controller.listSteps).mockReturnValue([
      'Given I am on "/"',
      'Then the page contains text "Hello"',
    ]);

    const result = parseResult(await call({ sessionId: 'sess-abc' }));
    expect(result.steps).toEqual(['Given I am on "/"', 'Then the page contains text "Hello"']);
    expect(session.controller.listSteps).toHaveBeenCalledWith(undefined);
  });

  it('passes type filter to controller.listSteps', async () => {
    vi.mocked(session.controller.listSteps).mockReturnValue(['Given I am on "/"']);

    const result = parseResult(await call({ sessionId: 'sess-abc', type: 'Given' }));
    expect(result.steps).toEqual(['Given I am on "/"']);
    expect(session.controller.listSteps).toHaveBeenCalledWith('Given');
  });

  it('calls sessions.get and sessions.touch with session id', async () => {
    await call({ sessionId: 'sess-abc' });
    expect(sessions.get).toHaveBeenCalledWith('sess-abc');
    expect(sessions.touch).toHaveBeenCalledWith('sess-abc');
  });

  it('returns err when sessions.get throws', async () => {
    vi.mocked(sessions.get).mockImplementation(() => {
      throw new Error('Session not found: x');
    });

    const result = await call({ sessionId: 'x' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Session not found');
  });
});
