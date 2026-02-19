import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerRun } from '../../src/tools/run';
import { captureHandler, makeSession, makeSessionManager, parseResult } from '../_helpers';

describe('registerRun', () => {
  const runResult = {
    status: 'passed' as const,
    steps: [{ text: 'Given I am on "/"', status: 'success' as const }],
    reason: undefined,
  };

  let session: ReturnType<typeof makeSession>;
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    session = makeSession();
    vi.mocked(session.controller.run).mockResolvedValue(runResult as any);
    sessions = makeSessionManager({ get: vi.fn().mockReturnValue(session) });
    call = captureHandler(registerRun, sessions);
  });

  it('calls sessions.get with the provided sessionId', async () => {
    await call({ sessionId: 'sess-abc', input: 'Given I am on "/"' });
    expect(sessions.get).toHaveBeenCalledWith('sess-abc');
  });

  it('calls sessions.touch', async () => {
    await call({ sessionId: 'sess-abc', input: 'Given I am on "/"' });
    expect(sessions.touch).toHaveBeenCalledWith('sess-abc');
  });

  it('clears the sink before running', async () => {
    await call({ sessionId: 'sess-abc', input: 'Given I am on "/"' });
    expect(session.sink.clear).toHaveBeenCalled();
  });

  it('wraps bare steps in a Feature block before passing to controller', async () => {
    await call({ sessionId: 'sess-abc', input: 'Given I am on "/"' });
    const feature = vi.mocked(session.controller.run).mock.calls[0][0] as string;
    expect(feature).toContain('Feature: MCP');
  });

  it('passes Feature blocks through to controller unchanged', async () => {
    const input = 'Feature: Login\n\nScenario: Go\n  Given I am on "/"';
    await call({ sessionId: 'sess-abc', input });
    expect(session.controller.run).toHaveBeenCalledWith(input);
  });

  it('returns status, steps and journal', async () => {
    const result = parseResult(await call({ sessionId: 'sess-abc', input: 'Given I am on "/"' }));
    expect(result.status).toBe('passed');
    expect(result.steps).toEqual(runResult.steps);
    expect(result.journal).toEqual([]);
  });

  it('returns reason when run fails', async () => {
    const error = new Error('element not found');
    vi.mocked(session.controller.run).mockResolvedValue({
      status: 'failed',
      steps: [],
      reason: error,
    } as any);
    const result = parseResult(await call({ sessionId: 'sess-abc', input: 'Given I am on "/"' }));
    expect(result.status).toBe('failed');
    expect(result.reason).toBe('element not found');
  });

  it('increments stepCount by the number of steps run', async () => {
    await call({ sessionId: 'sess-abc', input: 'Given I am on "/"' });
    expect(session.stepCount).toBe(1);
  });

  it('returns err when sessions.get throws', async () => {
    vi.mocked(sessions.get).mockImplementation(() => { throw new Error('Session not found: x'); });
    const result = await call({ sessionId: 'x', input: 'Given I am on "/"' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Session not found');
  });
});
