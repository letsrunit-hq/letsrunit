import type { Database } from './db';

import { toIdBlob } from './ids';

export function insertRun(db: Database, id: string, gitCommit: string | null, startedAt: number): void {
  db.run('INSERT OR IGNORE INTO runs (id, started_at, git_commit) VALUES (?, ?, ?)', [
    toIdBlob(id),
    startedAt,
    gitCommit,
  ]);
}

export function upsertFeature(db: Database, id: string, path: string, name: string): void {
  db.run('INSERT OR REPLACE INTO features (id, path, name) VALUES (?, ?, ?)', [toIdBlob(id), path, name]);
}

interface ScenarioRefs {
  rule?: string;
  outline?: string;
  exampleRow?: string;
  exampleIndex?: number;
}

export function upsertScenario(
  db: Database,
  id: string,
  featureId: string,
  index: number,
  name: string,
  refs: ScenarioRefs = {},
): void {
  db.run(
    `INSERT OR REPLACE INTO scenarios (
      id, feature, "index", name, rule, outline, example_row, example_index
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      toIdBlob(id),
      toIdBlob(featureId),
      index,
      name,
      refs.rule ? toIdBlob(refs.rule) : null,
      refs.outline ? toIdBlob(refs.outline) : null,
      refs.exampleRow ? toIdBlob(refs.exampleRow) : null,
      refs.exampleIndex ?? null,
    ],
  );
}

export function upsertStep(db: Database, id: string, text: string): void {
  db.run('INSERT OR REPLACE INTO steps (id, text) VALUES (?, ?)', [toIdBlob(id), text]);
}

export function upsertScenarioStep(db: Database, scenarioId: string, index: number, stepId: string): void {
  db.run('INSERT OR REPLACE INTO scenario_steps (scenario, "index", step) VALUES (?, ?, ?)', [
    toIdBlob(scenarioId),
    index,
    toIdBlob(stepId),
  ]);
}

export function insertTest(db: Database, id: string, runId: string, scenarioId: string, startedAt: number): void {
  db.run('INSERT INTO tests (id, run, scenario, started_at) VALUES (?, ?, ?, ?)', [
    toIdBlob(id),
    toIdBlob(runId),
    toIdBlob(scenarioId),
    startedAt,
  ]);
}

export function finaliseTest(db: Database, id: string, status: string, failedStepIndex?: number, error?: string): void {
  db.run('UPDATE tests SET status = ?, failed_step_index = ?, error = ? WHERE id = ?', [
    status,
    failedStepIndex ?? null,
    error ?? null,
    toIdBlob(id),
  ]);
}

export function insertArtifact(db: Database, id: string, testId: string, stepIndex: number, filename: string): void {
  db.run('INSERT INTO artifacts (id, test, step_index, filename) VALUES (?, ?, ?, ?)', [
    toIdBlob(id),
    toIdBlob(testId),
    stepIndex,
    filename,
  ]);
}
