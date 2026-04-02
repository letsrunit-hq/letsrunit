import type { Database } from './db';
import { fromIdBlob, toIdBlob } from './id-codec';

export function findLastTest(
  db: Database,
  scenarioId: string,
  status?: string,
  allowedCommits?: string[],
): { id: string; gitCommit: string | null } | null {
  const conditions: string[] = ['t.scenario = ?'];
  const params: (string | number | null | Uint8Array)[] = [toIdBlob(scenarioId)];

  if (status !== undefined) {
    conditions.push('t.status = ?');
    params.push(status);
  }

  if (allowedCommits !== undefined) {
    conditions.push('r.git_commit IN (SELECT value FROM json_each(?))');
    params.push(JSON.stringify(allowedCommits));
  }

  const sql = `
    SELECT t.id, r.git_commit
    FROM tests t
    JOIN runs r ON t.run = r.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY t.started_at DESC
    LIMIT 1
  `;

  const row = db.get(sql, params) as { id: Uint8Array; git_commit: string | null } | undefined;
  if (!row) return null;
  return { id: fromIdBlob(row.id), gitCommit: row.git_commit };
}

export function findLastPassingBaseline(
  db: Database,
  scenarioId: string,
  allowedCommits?: string[],
): { testId: string; gitCommit: string | null } | null {
  const test = findLastTest(db, scenarioId, 'passed', allowedCommits);
  if (!test) return null;
  return { testId: test.id, gitCommit: test.gitCommit };
}

export function findArtifacts(
  db: Database,
  testId: string,
  stepId?: string,
): Array<{ filename: string; stepId: string; stepIdx: number }> {
  const conditions: string[] = ['a.test = ?'];
  const params: (string | number | null | Uint8Array)[] = [toIdBlob(testId)];

  if (stepId !== undefined) {
    conditions.push('ss.step = ?');
    params.push(toIdBlob(stepId));
  }

  const sql = `
    SELECT a.filename, ss.step, a.step_index
    FROM artifacts a
    JOIN tests t ON a.test = t.id
    JOIN scenario_steps ss ON ss.scenario = t.scenario AND ss."index" = a.step_index
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.step_index ASC
  `;

  const rows = db.all(sql, params) as Array<{ filename: string; step: Uint8Array; step_index: number }>;
  return rows.map((r) => ({ filename: r.filename, stepId: fromIdBlob(r.step), stepIdx: r.step_index }));
}

export interface LastRunStep {
  id: string;
  index: number;
  text: string;
}

export interface LastRunTest {
  id: string;
  scenarioId: string;
  scenarioName: string;
  featureId: string;
  featurePath: string;
  featureName: string;
  status: string;
  startedAt: number;
  failedStepIndex: number | null;
  error: string | null;
  ruleId: string | null;
  outlineId: string | null;
  exampleRowId: string | null;
  exampleIndex: number | null;
  steps: LastRunStep[];
}

export interface LastRun {
  id: string;
  startedAt: number;
  gitCommit: string | null;
  tests: LastRunTest[];
}

export function findLastRun(db: Database): LastRun | null {
  const run = db.get(
    `
      SELECT id, started_at, git_commit
      FROM runs
      ORDER BY started_at DESC
      LIMIT 1
    `,
  ) as { id: Uint8Array; started_at: number; git_commit: string | null } | undefined;

  if (!run) return null;

  const tests = db.all(
    `
      SELECT
        t.id,
        t.scenario,
        s.name AS scenario_name,
        s.rule,
        s.outline,
        s.example_row,
        s.example_index,
        f.id AS feature_id,
        f.path AS feature_path,
        f.name AS feature_name,
        t.status,
        t.started_at,
        t.failed_step_index,
        t.error
      FROM tests t
      JOIN scenarios s ON s.id = t.scenario
      JOIN features f ON f.id = s.feature
      WHERE t.run = ?
      ORDER BY t.started_at ASC
    `,
    [run.id],
  ) as Array<{
    id: Uint8Array;
    scenario: Uint8Array;
    scenario_name: string;
    rule: Uint8Array | null;
    outline: Uint8Array | null;
    example_row: Uint8Array | null;
    example_index: number | null;
    feature_id: Uint8Array;
    feature_path: string;
    feature_name: string;
    status: string;
    started_at: number;
    failed_step_index: number | null;
    error: string | null;
  }>;

  const withSteps = tests.map((test) => {
    const steps = db.all(
      `
        SELECT ss.step, ss."index", st.text
        FROM scenario_steps ss
        JOIN steps st ON st.id = ss.step
        WHERE ss.scenario = ?
        ORDER BY ss."index" ASC
      `,
      [test.scenario],
    ) as Array<{ step: Uint8Array; index: number; text: string }>;

    return {
      id: fromIdBlob(test.id),
      scenarioId: fromIdBlob(test.scenario),
      scenarioName: test.scenario_name,
      featureId: fromIdBlob(test.feature_id),
      featurePath: test.feature_path,
      featureName: test.feature_name,
      status: test.status,
      startedAt: test.started_at,
      failedStepIndex: test.failed_step_index,
      error: test.error,
      ruleId: test.rule ? fromIdBlob(test.rule) : null,
      outlineId: test.outline ? fromIdBlob(test.outline) : null,
      exampleRowId: test.example_row ? fromIdBlob(test.example_row) : null,
      exampleIndex: test.example_index,
      steps: steps.map((step) => ({
        id: fromIdBlob(step.step),
        index: step.index,
        text: step.text,
      })),
    } satisfies LastRunTest;
  });

  return {
    id: fromIdBlob(run.id),
    startedAt: run.started_at,
    gitCommit: run.git_commit,
    tests: withSteps,
  };
}
