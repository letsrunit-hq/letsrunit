import type { Database } from './db';

export function insertRun(db: Database, id: string, gitCommit: string | null, startedAt: number): void {
  db.run('INSERT OR IGNORE INTO runs (id, started_at, git_commit) VALUES (?, ?, ?)', [id, startedAt, gitCommit]);
}

export function upsertFeature(db: Database, id: string, path: string, name: string): void {
  db.run('INSERT OR REPLACE INTO features (id, path, name) VALUES (?, ?, ?)', [id, path, name]);
}

export function upsertScenario(db: Database, id: string, featureId: string, name: string): void {
  db.run('INSERT OR REPLACE INTO scenarios (id, feature_id, name) VALUES (?, ?, ?)', [id, featureId, name]);
}

export function upsertStep(db: Database, id: string, scenarioId: string, idx: number, text: string): void {
  db.run('INSERT OR REPLACE INTO steps (id, scenario_id, idx, text) VALUES (?, ?, ?, ?)', [id, scenarioId, idx, text]);
}

export function insertTest(db: Database, id: string, runId: string, scenarioId: string, startedAt: number): void {
  db.run('INSERT INTO tests (id, run_id, scenario_id, started_at) VALUES (?, ?, ?, ?)', [id, runId, scenarioId, startedAt]);
}

export function finaliseTest(db: Database, id: string, status: string, failedStepId?: string, error?: string): void {
  db.run('UPDATE tests SET status = ?, failed_step_id = ?, error = ? WHERE id = ?', [status, failedStepId ?? null, error ?? null, id]);
}

export function insertArtifact(db: Database, id: string, testId: string, stepId: string, filename: string): void {
  db.run('INSERT INTO artifacts (id, test_id, step_id, filename) VALUES (?, ?, ?, ?)', [id, testId, stepId, filename]);
}
