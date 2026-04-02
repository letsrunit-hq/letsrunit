import { describe, beforeEach, expect, it } from 'vitest';
import { openStore } from '../src/db';
import {
  insertRun,
  upsertFeature,
  upsertScenario,
  upsertStep,
  upsertScenarioStep,
  insertTest,
  finaliseTest,
  insertArtifact,
} from '../src/write';
import { findLastRun, findLastTest, findLastPassingBaseline, findArtifacts } from '../src/read';
import { computeStepId } from '../src/ids';
import type { Database } from 'node-sqlite3-wasm';

let db: Database;

beforeEach(() => {
  db = openStore(':memory:');
});

function id(label: string): string {
  return computeStepId(`id:${label}`);
}

function seed() {
  insertRun(db, id('run-1'), 'abc123', 1000);
  insertRun(db, id('run-2'), 'def456', 2000);
  insertRun(db, id('run-3'), null, 3000);

  upsertFeature(db, id('feat-1'), 'features/login.feature', 'Login');
  upsertScenario(db, id('scen-1'), id('feat-1'), 0, 'User logs in');

  upsertStep(db, id('step-1'), 'Given I am on the login page');
  upsertStep(db, id('step-2'), 'When I submit credentials');

  upsertScenarioStep(db, id('scen-1'), 0, id('step-1'));
  upsertScenarioStep(db, id('scen-1'), 1, id('step-2'));
}

describe('findLastTest', () => {
  beforeEach(seed);

  it('returns the most recent test for a scenario', () => {
    insertTest(db, id('test-1'), id('run-1'), id('scen-1'), 100);
    finaliseTest(db, id('test-1'), 'passed');
    insertTest(db, id('test-2'), id('run-2'), id('scen-1'), 200);
    finaliseTest(db, id('test-2'), 'passed');

    const result = findLastTest(db, id('scen-1'));
    expect(result?.id).toBe(id('test-2'));
  });

  it('filters by status', () => {
    insertTest(db, id('test-1'), id('run-1'), id('scen-1'), 100);
    finaliseTest(db, id('test-1'), 'failed', 1);
    insertTest(db, id('test-2'), id('run-2'), id('scen-1'), 200);
    finaliseTest(db, id('test-2'), 'passed');

    const passed = findLastTest(db, id('scen-1'), 'passed');
    expect(passed?.id).toBe(id('test-2'));

    const failed = findLastTest(db, id('scen-1'), 'failed');
    expect(failed?.id).toBe(id('test-1'));
  });

  it('ignores tests with a non-matching status', () => {
    insertTest(db, id('test-1'), id('run-1'), id('scen-1'), 100);
    finaliseTest(db, id('test-1'), 'failed', 0);

    const result = findLastTest(db, id('scen-1'), 'passed');
    expect(result).toBeNull();
  });

  it('filters by allowedCommits — returns test whose run commit is in the list', () => {
    insertTest(db, id('test-1'), id('run-1'), id('scen-1'), 100); // commit abc123
    finaliseTest(db, id('test-1'), 'passed');
    insertTest(db, id('test-2'), id('run-2'), id('scen-1'), 200); // commit def456
    finaliseTest(db, id('test-2'), 'passed');

    const result = findLastTest(db, id('scen-1'), 'passed', ['abc123']);
    expect(result?.id).toBe(id('test-1'));
    expect(result?.gitCommit).toBe('abc123');
  });

  it('filters by allowedCommits — excludes test whose commit is not in the list', () => {
    insertTest(db, id('test-1'), id('run-2'), id('scen-1'), 100); // commit def456
    finaliseTest(db, id('test-1'), 'passed');

    const result = findLastTest(db, id('scen-1'), 'passed', ['abc123']);
    expect(result).toBeNull();
  });

  it('excludes tests with null commit when allowedCommits is provided', () => {
    insertTest(db, id('test-1'), id('run-3'), id('scen-1'), 100); // null commit
    finaliseTest(db, id('test-1'), 'passed');

    const result = findLastTest(db, id('scen-1'), 'passed', ['abc123']);
    expect(result).toBeNull();
  });

  it('returns null when no tests exist for the scenario', () => {
    expect(findLastTest(db, id('scen-1'))).toBeNull();
  });

  it('exposes gitCommit in the result', () => {
    insertTest(db, id('test-1'), id('run-1'), id('scen-1'), 100);
    finaliseTest(db, id('test-1'), 'passed');

    const result = findLastTest(db, id('scen-1'), 'passed');
    expect(result?.gitCommit).toBe('abc123');
  });

  it('exposes null gitCommit when run has no commit', () => {
    insertTest(db, id('test-1'), id('run-3'), id('scen-1'), 100);
    finaliseTest(db, id('test-1'), 'passed');

    const result = findLastTest(db, id('scen-1'), 'passed');
    expect(result?.gitCommit).toBeNull();
  });
});

describe('findLastPassingBaseline', () => {
  beforeEach(seed);

  it('returns latest passing test for a scenario', () => {
    insertTest(db, id('test-1'), id('run-1'), id('scen-1'), 100);
    finaliseTest(db, id('test-1'), 'passed');
    insertTest(db, id('test-2'), id('run-2'), id('scen-1'), 200);
    finaliseTest(db, id('test-2'), 'passed');

    const result = findLastPassingBaseline(db, id('scen-1'));
    expect(result).toEqual({
      testId: id('test-2'),
      gitCommit: 'def456',
    });
  });

  it('returns null when no passing baseline exists', () => {
    insertTest(db, id('test-1'), id('run-1'), id('scen-1'), 100);
    finaliseTest(db, id('test-1'), 'failed', 0);

    const result = findLastPassingBaseline(db, id('scen-1'));
    expect(result).toBeNull();
  });

  it('respects allowedCommits filter', () => {
    insertTest(db, id('test-1'), id('run-1'), id('scen-1'), 100);
    finaliseTest(db, id('test-1'), 'passed');
    insertTest(db, id('test-2'), id('run-2'), id('scen-1'), 200);
    finaliseTest(db, id('test-2'), 'passed');

    const result = findLastPassingBaseline(db, id('scen-1'), ['abc123']);
    expect(result).toEqual({
      testId: id('test-1'),
      gitCommit: 'abc123',
    });
  });
});

describe('findArtifacts', () => {
  beforeEach(() => {
    seed();
    insertRun(db, id('run-a'), null, 4000);
    insertTest(db, id('test-a'), id('run-a'), id('scen-1'), 100);
    finaliseTest(db, id('test-a'), 'passed');
  });

  it('returns all artifacts for a test ordered by step index', () => {
    insertArtifact(db, id('art-1'), id('test-a'), 1, 'hash2.png');
    insertArtifact(db, id('art-2'), id('test-a'), 0, 'hash1.html');

    const result = findArtifacts(db, id('test-a'));
    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('hash1.html');
    expect(result[1].filename).toBe('hash2.png');
  });

  it('exposes stepId and stepIdx on each artifact', () => {
    insertArtifact(db, id('art-1'), id('test-a'), 0, 'hash1.html');

    const [artifact] = findArtifacts(db, id('test-a'));
    expect(artifact.stepId).toBe(id('step-1'));
    expect(artifact.stepIdx).toBe(0);
  });

  it('filters by stepId', () => {
    insertArtifact(db, id('art-1'), id('test-a'), 0, 'hash1.html');
    insertArtifact(db, id('art-2'), id('test-a'), 1, 'hash2.png');

    const result = findArtifacts(db, id('test-a'), id('step-1'));
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('hash1.html');
  });

  it('returns empty array when test has no artifacts', () => {
    expect(findArtifacts(db, id('test-a'))).toHaveLength(0);
  });

  it('returns empty array for unknown test', () => {
    expect(findArtifacts(db, id('no-such-test'))).toHaveLength(0);
  });
});

describe('findLastRun', () => {
  beforeEach(() => {
    seed();
    insertTest(db, id('test-1'), id('run-1'), id('scen-1'), 1100);
    finaliseTest(db, id('test-1'), 'failed', 1, 'Bad credentials');
  });

  it('returns the latest run and all tests for that run', () => {
    insertRun(db, id('run-4'), 'xyz789', 5000);
    insertTest(db, id('test-2'), id('run-4'), id('scen-1'), 5100);
    finaliseTest(db, id('test-2'), 'failed', 0, 'Timeout');

    const run = findLastRun(db);

    expect(run?.id).toBe(id('run-4'));
    expect(run?.gitCommit).toBe('xyz789');
    expect(run?.tests).toHaveLength(1);
    expect(run?.tests[0].id).toBe(id('test-2'));
    expect(run?.tests[0].failedStepIndex).toBe(0);
    expect(run?.tests[0].steps.map((s) => s.index)).toEqual([0, 1]);
  });

  it('returns null when there are no runs', () => {
    const emptyDb = openStore(':memory:');
    expect(findLastRun(emptyDb)).toBeNull();
  });
});
