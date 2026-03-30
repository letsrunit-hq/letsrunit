import { describe, beforeEach, expect, it } from 'vitest';
import { openStore } from '../src/db';
import { insertRun, upsertFeature, upsertScenario, upsertStep, insertTest, finaliseTest, insertArtifact } from '../src/write';
import { findLastTest, findArtifacts } from '../src/read';
import type { Database } from 'node-sqlite3-wasm';

let db: Database;

beforeEach(() => {
  db = openStore(':memory:');
});

// --- helpers ---

function seed() {
  insertRun(db, 'run-1', 'abc123', 1000);
  insertRun(db, 'run-2', 'def456', 2000);
  insertRun(db, 'run-3', null, 3000);
  upsertFeature(db, 'feat-1', 'features/login.feature', 'Login');
  upsertScenario(db, 'scen-1', 'feat-1', 'User logs in');
  upsertStep(db, 'step-1', 'scen-1', 0, 'Given I am on the login page');
  upsertStep(db, 'step-2', 'scen-1', 1, 'When I submit credentials');
}

describe('findLastTest', () => {
  beforeEach(seed);

  it('returns the most recent test for a scenario', () => {
    insertTest(db, 'test-1', 'run-1', 'scen-1', 100);
    finaliseTest(db, 'test-1', 'passed');
    insertTest(db, 'test-2', 'run-2', 'scen-1', 200);
    finaliseTest(db, 'test-2', 'passed');

    const result = findLastTest(db, 'scen-1');
    expect(result?.id).toBe('test-2');
  });

  it('filters by status', () => {
    insertTest(db, 'test-1', 'run-1', 'scen-1', 100);
    finaliseTest(db, 'test-1', 'failed');
    insertTest(db, 'test-2', 'run-2', 'scen-1', 200);
    finaliseTest(db, 'test-2', 'passed');

    const passed = findLastTest(db, 'scen-1', 'passed');
    expect(passed?.id).toBe('test-2');

    const failed = findLastTest(db, 'scen-1', 'failed');
    expect(failed?.id).toBe('test-1');
  });

  it('ignores tests with a non-matching status', () => {
    insertTest(db, 'test-1', 'run-1', 'scen-1', 100);
    finaliseTest(db, 'test-1', 'failed');

    const result = findLastTest(db, 'scen-1', 'passed');
    expect(result).toBeNull();
  });

  it('filters by allowedCommits — returns test whose run commit is in the list', () => {
    insertTest(db, 'test-1', 'run-1', 'scen-1', 100); // commit abc123
    finaliseTest(db, 'test-1', 'passed');
    insertTest(db, 'test-2', 'run-2', 'scen-1', 200); // commit def456
    finaliseTest(db, 'test-2', 'passed');

    const result = findLastTest(db, 'scen-1', 'passed', ['abc123']);
    expect(result?.id).toBe('test-1');
    expect(result?.gitCommit).toBe('abc123');
  });

  it('filters by allowedCommits — excludes test whose commit is not in the list', () => {
    insertTest(db, 'test-1', 'run-2', 'scen-1', 100); // commit def456
    finaliseTest(db, 'test-1', 'passed');

    const result = findLastTest(db, 'scen-1', 'passed', ['abc123']);
    expect(result).toBeNull();
  });

  it('excludes tests with null commit when allowedCommits is provided', () => {
    insertTest(db, 'test-1', 'run-3', 'scen-1', 100); // null commit
    finaliseTest(db, 'test-1', 'passed');

    const result = findLastTest(db, 'scen-1', 'passed', ['abc123']);
    expect(result).toBeNull();
  });

  it('returns null when no tests exist for the scenario', () => {
    expect(findLastTest(db, 'scen-1')).toBeNull();
  });

  it('exposes gitCommit in the result', () => {
    insertTest(db, 'test-1', 'run-1', 'scen-1', 100);
    finaliseTest(db, 'test-1', 'passed');

    const result = findLastTest(db, 'scen-1', 'passed');
    expect(result?.gitCommit).toBe('abc123');
  });

  it('exposes null gitCommit when run has no commit', () => {
    insertTest(db, 'test-1', 'run-3', 'scen-1', 100);
    finaliseTest(db, 'test-1', 'passed');

    const result = findLastTest(db, 'scen-1', 'passed');
    expect(result?.gitCommit).toBeNull();
  });
});

describe('findArtifacts', () => {
  beforeEach(() => {
    seed();
    insertRun(db, 'run-a', null, 1000);
    insertTest(db, 'test-a', 'run-a', 'scen-1', 100);
    finaliseTest(db, 'test-a', 'passed');
  });

  it('returns all artifacts for a test ordered by step index', () => {
    insertArtifact(db, 'art-1', 'test-a', 'step-2', 'hash2.png');
    insertArtifact(db, 'art-2', 'test-a', 'step-1', 'hash1.html');

    const result = findArtifacts(db, 'test-a');
    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('hash1.html'); // step idx 0 first
    expect(result[1].filename).toBe('hash2.png');  // step idx 1 second
  });

  it('exposes stepId and stepIdx on each artifact', () => {
    insertArtifact(db, 'art-1', 'test-a', 'step-1', 'hash1.html');

    const [artifact] = findArtifacts(db, 'test-a');
    expect(artifact.stepId).toBe('step-1');
    expect(artifact.stepIdx).toBe(0);
  });

  it('filters by stepId', () => {
    insertArtifact(db, 'art-1', 'test-a', 'step-1', 'hash1.html');
    insertArtifact(db, 'art-2', 'test-a', 'step-2', 'hash2.png');

    const result = findArtifacts(db, 'test-a', 'step-1');
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('hash1.html');
  });

  it('returns empty array when test has no artifacts', () => {
    expect(findArtifacts(db, 'test-a')).toHaveLength(0);
  });

  it('returns empty array for unknown test', () => {
    expect(findArtifacts(db, 'no-such-test')).toHaveLength(0);
  });
});
