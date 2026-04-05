import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDiff } from '../../src/tools/diff';
import { captureHandler, makeSession, makeSessionManager, parseResult } from '../_helpers';

vi.mock('@letsrunit/store', () => ({
  openStore: vi.fn(),
  findLastTest: vi.fn(),
  findArtifacts: vi.fn(),
}));

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('@letsrunit/playwright', () => ({
  unifiedHtmlDiff: vi.fn(),
}));

import * as store from '@letsrunit/store';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { unifiedHtmlDiff } from '@letsrunit/playwright';

const mockDb = { close: vi.fn() };
const SCENARIO_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TEST_ID = 'test-1';
const GIT_COMMIT = 'abc123';

describe('registerDiff', () => {
  let session: ReturnType<typeof makeSession>;
  let sessions: ReturnType<typeof makeSessionManager>;
  let call: (input: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(store.openStore).mockReturnValue(mockDb as any);
    vi.mocked(store.findLastTest).mockReturnValue({ id: TEST_ID, gitCommit: GIT_COMMIT });
    vi.mocked(store.findArtifacts).mockReturnValue([
      { filename: 'snap.html', stepId: 'step-1', stepIdx: 0 },
      { filename: 'screen.png', stepId: 'step-1', stepIdx: 0 },
    ]);
    vi.mocked(readFileSync).mockReturnValue('<html><body>old</body></html>' as any);
    vi.mocked(execSync).mockReturnValue('abc123\ndef456\n' as any);
    vi.mocked(unifiedHtmlDiff).mockResolvedValue('--- before\n+++ after\n@@ -1 +1 @@\n-old\n+new');

    session = makeSession();
    sessions = makeSessionManager({ get: vi.fn().mockReturnValue(session) });
    call = captureHandler(registerDiff, sessions);
  });

  it('calls sessions.get and sessions.touch', async () => {
    await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID });
    expect(sessions.get).toHaveBeenCalledWith('sess-abc');
    expect(sessions.touch).toHaveBeenCalledWith('sess-abc');
  });

  it('returns diff and baseline metadata on happy path', async () => {
    const result = parseResult(await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID }));
    expect(result.diff).toContain('--- before');
    expect(result.baseline.testId).toBe(TEST_ID);
    expect(result.baseline.commit).toBe(GIT_COMMIT);
    expect(result.baseline.screenshots).toHaveLength(1);
    expect(result.baseline.screenshots[0]).toMatch(/screen\.png$/);
  });

  it('calls git log when gitTreeOnly is true (default)', async () => {
    await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID });
    expect(execSync).toHaveBeenCalledWith('git log --format=%H', { encoding: 'utf8' });
  });

  it('passes allowedCommits to findLastTest when gitTreeOnly is true', async () => {
    await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID, gitTreeOnly: true });
    expect(store.findLastTest).toHaveBeenCalledWith(
      mockDb,
      SCENARIO_ID,
      'passed',
      ['abc123', 'def456'],
    );
  });

  it('does not call git log when gitTreeOnly is false', async () => {
    await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID, gitTreeOnly: false });
    expect(execSync).not.toHaveBeenCalled();
  });

  it('passes undefined allowedCommits to findLastTest when gitTreeOnly is false', async () => {
    await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID, gitTreeOnly: false });
    expect(store.findLastTest).toHaveBeenCalledWith(mockDb, SCENARIO_ID, 'passed', undefined);
  });

  it('proceeds unfiltered when git log fails', async () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not a git repo'); });
    await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID });
    expect(store.findLastTest).toHaveBeenCalledWith(mockDb, SCENARIO_ID, 'passed', undefined);
  });

  it('returns isError when no passing test is found', async () => {
    vi.mocked(store.findLastTest).mockReturnValue(null);
    const result = await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No passing test');
  });

  it('returns isError when no HTML artifact is found', async () => {
    vi.mocked(store.findArtifacts).mockReturnValue([
      { filename: 'screen.png', stepId: 'step-1', stepIdx: 0 },
    ]);
    const result = await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No HTML snapshot');
  });

  it('returns isError when unifiedHtmlDiff throws', async () => {
    vi.mocked(unifiedHtmlDiff).mockRejectedValue(new Error('page crashed'));
    const result = await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('page crashed');
  });

  it('closes the DB in the happy path', async () => {
    await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID });
    expect(mockDb.close).toHaveBeenCalled();
  });

  it('closes the DB when findLastTest returns null', async () => {
    vi.mocked(store.findLastTest).mockReturnValue(null);
    await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID });
    expect(mockDb.close).toHaveBeenCalled();
  });

  it('closes the DB when unifiedHtmlDiff throws', async () => {
    vi.mocked(unifiedHtmlDiff).mockRejectedValue(new Error('boom'));
    await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID });
    expect(mockDb.close).toHaveBeenCalled();
  });

  it('screenshot paths are absolute', async () => {
    const result = parseResult(await call({ sessionId: 'sess-abc', scenarioId: SCENARIO_ID }));
    expect(result.baseline.screenshots[0]).toMatch(/^\//);
  });
});
