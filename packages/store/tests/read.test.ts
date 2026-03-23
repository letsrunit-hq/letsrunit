import { describe, beforeEach, expect, it } from 'vitest';
import { openStore } from '../src/db';
import { insertSession, upsertFeature, upsertScenario, upsertStep, insertRun, finaliseRun, insertArtifact } from '../src/write';
import { findLastRun, findArtifacts } from '../src/read';
import type { Database } from 'node-sqlite3-wasm';

let db: Database;

beforeEach(() => {
  db = openStore(':memory:');
});

// --- helpers ---

function seed() {
  insertSession(db, 'sess-1', 'abc123', 1000);
  insertSession(db, 'sess-2', 'def456', 2000);
  insertSession(db, 'sess-3', null, 3000);
  upsertFeature(db, 'feat-1', 'features/login.feature', 'Login');
  upsertScenario(db, 'scen-1', 'feat-1', 'User logs in');
  upsertStep(db, 'step-1', 'scen-1', 0, 'Given I am on the login page');
  upsertStep(db, 'step-2', 'scen-1', 1, 'When I submit credentials');
}

describe('findLastRun', () => {
  beforeEach(seed);

  it('returns the most recent run for a scenario', () => {
    insertRun(db, 'run-1', 'sess-1', 'scen-1', 100);
    finaliseRun(db, 'run-1', 'passed');
    insertRun(db, 'run-2', 'sess-2', 'scen-1', 200);
    finaliseRun(db, 'run-2', 'passed');

    const result = findLastRun(db, 'scen-1');
    expect(result?.id).toBe('run-2');
  });

  it('filters by status', () => {
    insertRun(db, 'run-1', 'sess-1', 'scen-1', 100);
    finaliseRun(db, 'run-1', 'failed');
    insertRun(db, 'run-2', 'sess-2', 'scen-1', 200);
    finaliseRun(db, 'run-2', 'passed');

    const passed = findLastRun(db, 'scen-1', 'passed');
    expect(passed?.id).toBe('run-2');

    const failed = findLastRun(db, 'scen-1', 'failed');
    expect(failed?.id).toBe('run-1');
  });

  it('ignores runs with a non-matching status', () => {
    insertRun(db, 'run-1', 'sess-1', 'scen-1', 100);
    finaliseRun(db, 'run-1', 'failed');

    const result = findLastRun(db, 'scen-1', 'passed');
    expect(result).toBeNull();
  });

  it('filters by allowedCommits — returns run whose session commit is in the list', () => {
    insertRun(db, 'run-1', 'sess-1', 'scen-1', 100); // commit abc123
    finaliseRun(db, 'run-1', 'passed');
    insertRun(db, 'run-2', 'sess-2', 'scen-1', 200); // commit def456
    finaliseRun(db, 'run-2', 'passed');

    const result = findLastRun(db, 'scen-1', 'passed', ['abc123']);
    expect(result?.id).toBe('run-1');
    expect(result?.gitCommit).toBe('abc123');
  });

  it('filters by allowedCommits — excludes run whose commit is not in the list', () => {
    insertRun(db, 'run-1', 'sess-2', 'scen-1', 100); // commit def456
    finaliseRun(db, 'run-1', 'passed');

    const result = findLastRun(db, 'scen-1', 'passed', ['abc123']);
    expect(result).toBeNull();
  });

  it('excludes runs with null commit when allowedCommits is provided', () => {
    insertRun(db, 'run-1', 'sess-3', 'scen-1', 100); // null commit
    finaliseRun(db, 'run-1', 'passed');

    const result = findLastRun(db, 'scen-1', 'passed', ['abc123']);
    expect(result).toBeNull();
  });

  it('returns null when no runs exist for the scenario', () => {
    expect(findLastRun(db, 'scen-1')).toBeNull();
  });

  it('exposes gitCommit in the result', () => {
    insertRun(db, 'run-1', 'sess-1', 'scen-1', 100);
    finaliseRun(db, 'run-1', 'passed');

    const result = findLastRun(db, 'scen-1', 'passed');
    expect(result?.gitCommit).toBe('abc123');
  });

  it('exposes null gitCommit when session has no commit', () => {
    insertRun(db, 'run-1', 'sess-3', 'scen-1', 100);
    finaliseRun(db, 'run-1', 'passed');

    const result = findLastRun(db, 'scen-1', 'passed');
    expect(result?.gitCommit).toBeNull();
  });
});

describe('findArtifacts', () => {
  beforeEach(() => {
    seed();
    insertSession(db, 'sess-a', null, 1000);
    insertRun(db, 'run-a', 'sess-a', 'scen-1', 100);
    finaliseRun(db, 'run-a', 'passed');
  });

  it('returns all artifacts for a run ordered by step index', () => {
    insertArtifact(db, 'art-1', 'run-a', 'step-2', 'hash2.png');
    insertArtifact(db, 'art-2', 'run-a', 'step-1', 'hash1.html');

    const result = findArtifacts(db, 'run-a');
    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('hash1.html'); // step idx 0 first
    expect(result[1].filename).toBe('hash2.png');  // step idx 1 second
  });

  it('exposes stepId and stepIdx on each artifact', () => {
    insertArtifact(db, 'art-1', 'run-a', 'step-1', 'hash1.html');

    const [artifact] = findArtifacts(db, 'run-a');
    expect(artifact.stepId).toBe('step-1');
    expect(artifact.stepIdx).toBe(0);
  });

  it('filters by stepId', () => {
    insertArtifact(db, 'art-1', 'run-a', 'step-1', 'hash1.html');
    insertArtifact(db, 'art-2', 'run-a', 'step-2', 'hash2.png');

    const result = findArtifacts(db, 'run-a', 'step-1');
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('hash1.html');
  });

  it('returns empty array when run has no artifacts', () => {
    expect(findArtifacts(db, 'run-a')).toHaveLength(0);
  });

  it('returns empty array for unknown run', () => {
    expect(findArtifacts(db, 'no-such-run')).toHaveLength(0);
  });
});
