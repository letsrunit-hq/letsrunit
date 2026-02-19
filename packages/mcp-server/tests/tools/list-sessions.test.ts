import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerListSessions } from '../../src/tools/list-sessions';
import { captureHandler, makeSession, makeSessionManager, parseResult } from '../_helpers';

describe('registerListSessions', () => {
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    sessions = makeSessionManager();
    call = captureHandler(registerListSessions, sessions);
  });

  it('returns an empty list when there are no sessions', async () => {
    vi.mocked(sessions.list).mockReturnValue([]);
    const result = parseResult(await call({}));
    expect(result.sessions).toEqual([]);
  });

  it('maps session fields to the response', async () => {
    const session = makeSession({
      id: 'sess-xyz',
      createdAt: 1000,
      lastActivity: 2000,
      stepCount: 5,
      artifactDir: '/artifacts/sess-xyz',
    });
    vi.mocked(sessions.list).mockReturnValue([session]);

    const result = parseResult(await call({}));
    expect(result.sessions).toEqual([
      {
        sessionId: 'sess-xyz',
        createdAt: 1000,
        lastActivity: 2000,
        stepCount: 5,
        artifactDir: '/artifacts/sess-xyz',
      },
    ]);
  });

  it('returns multiple sessions', async () => {
    vi.mocked(sessions.list).mockReturnValue([makeSession(), makeSession({ id: 'sess-2' })]);
    const result = parseResult(await call({}));
    expect(result.sessions).toHaveLength(2);
  });
});
