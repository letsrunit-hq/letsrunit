import { formatterHelpers, type IFormatterOptions, Formatter } from '@cucumber/cucumber';
import { type Envelope } from '@cucumber/messages';
import { findArtifacts, findLastTest, openStore } from '@letsrunit/store';
import { unifiedHtmlDiff } from '@letsrunit/playwright';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import {
  extractFailureDetails,
  normalizeUrl,
  stripAnsi,
} from './lib/failure-details';
import { resolveAllowedCommits } from './lib/git-commits';
import { toScenarioId } from './lib/scenario-id';
import { normalizeStatus, toDurationMs } from './lib/status';
import { getConfiguredStoreDbPath } from './store-config';

type ParsedStep = {
  keyword: string;
  text?: string;
  result: { status: string; message?: string; duration?: { seconds?: number; nanos?: number } };
  attachments?: Array<{ body: string; mediaType: string; fileName?: string }>;
  argument?: {
    docString?: { content: string };
    dataTable?: { rows: ReadonlyArray<{ cells: ReadonlyArray<{ value: string }> }> };
  };
};

type ParsedScenario = {
  name: string;
  sourceLocation?: { uri: string; line: number };
};

type FailureStructured = {
  kind: 'assertion' | 'timeout' | 'navigation' | 'unknown';
  summary?: string;
  locator?: string;
  locator_full?: string;
  url?: string;
  expected?: string;
  actual?: string;
  timeout_ms?: number;
};

type DiffReason =
  | 'no_store_config'
  | 'no_baseline'
  | 'no_html_snapshot'
  | 'no_current_html'
  | 'read_baseline_failed'
  | 'diff_compute_failed';

type FailurePayload = {
  error: string;
  kind: FailureStructured['kind'];
  summary?: string;
  locator?: string;
  locator_full?: string;
  url?: string;
  expected?: string;
  actual?: string;
  timeout_ms?: number;
  html_snapshot?: string;
  baseline?: { test_id: string; commit: string | null; screenshots: string[] };
  diff?: string;
  diff_available: boolean;
  diff_reason?: DiffReason;
};

type BaselineContext = {
  testId: string;
  gitCommit: string | null;
  artifacts: Array<{ filename: string; stepId: string; stepIdx: number }>;
  artifactDir: string;
};

type ScenarioContext = {
  scenarioId?: string;
  attempt: number;
  stepIndexById: Map<string, number>;
};

function findAttachment(step: ParsedStep, mediaType: string): string | undefined {
  return step.attachments?.find((a) => a.mediaType === mediaType)?.body;
}

function extractUrlFromStep(step: ParsedStep): string | undefined {
  const urlRaw = findAttachment(step, 'text/x-letsrunit-url') ?? findAttachment(step, 'text/uri-list');
  if (urlRaw) return normalizeUrl(urlRaw);
  return undefined;
}

function classifyFailureKind(message: string, timeoutMs?: number): FailureStructured['kind'] {
  const lower = message.toLowerCase();
  if (lower.includes('expect(') || lower.includes('assert') || lower.includes('locator:')) return 'assertion';
  if (lower.includes('navigation') || lower.includes('net::') || lower.includes('page.goto')) return 'navigation';
  if (timeoutMs !== undefined || lower.includes('timeout')) return 'timeout';
  return 'unknown';
}

export function buildStructuredFailure(step: ParsedStep): FailureStructured {
  const raw = stripAnsi(step.result.message ?? '');
  const details = extractFailureDetails(raw);
  const url = extractUrlFromStep(step) ?? details.url;
  const timeout_ms = details.timeoutMs;

  return {
    kind: classifyFailureKind(raw, timeout_ms),
    summary: details.error,
    locator: details.locator,
    locator_full: details.locatorFull,
    url,
    expected: details.expected,
    actual: details.actual,
    timeout_ms,
  };
}

function emitLine(log: (buffer: string | Uint8Array) => void, payload: Record<string, unknown>): void {
  log(`${JSON.stringify(payload)}\n`);
}

function resolveBaselineScreenshots(
  artifacts: Array<{ filename: string; stepId: string; stepIdx: number }>,
  artifactDir: string,
  stepIndex: number,
): string[] {
  return artifacts
    .filter((a) => a.stepIdx === stepIndex && a.filename.endsWith('.png'))
    .map((a) => join(artifactDir, a.filename));
}

export default class AgentFormatter extends Formatter {
  static readonly documentation = 'Machine-focused NDJSON formatter for agent consumption.';

  private readonly runId = uuidv4();
  private runStarted = false;
  private processing: Promise<void> = Promise.resolve();
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private readonly scenarios = new Map<string, ScenarioContext>();

  constructor(options: IFormatterOptions) {
    super(options);
    options.eventBroadcaster.on('envelope', (envelope: Envelope) => {
      this.processing = this.processing.then(async () => {
        await this.handleEnvelope(envelope);
      });
    });
  }

  private createBaseFailurePayload(
    step: ParsedStep,
  ): Pick<
    FailurePayload,
    'error' | 'kind' | 'summary' | 'locator' | 'locator_full' | 'url' | 'expected' | 'actual' | 'timeout_ms'
  > {
    const error = stripAnsi(step.result.message ?? '');
    const errorStructured = buildStructuredFailure(step);
    return {
      error,
      kind: errorStructured.kind,
      summary: errorStructured.summary,
      locator: errorStructured.locator,
      locator_full: errorStructured.locator_full,
      url: errorStructured.url,
      expected: errorStructured.expected,
      actual: errorStructured.actual,
      timeout_ms: errorStructured.timeout_ms,
    };
  }

  private resolveStoreDbPath(): string | null {
    const dbPath = getConfiguredStoreDbPath();
    if (!dbPath || !existsSync(dbPath)) return null;
    return dbPath;
  }

  private loadBaselineContext(dbPath: string, scenarioId: string): BaselineContext | null {
    let db: ReturnType<typeof openStore> | undefined;
    try {
      db = openStore(dbPath);
      const baseline = findLastTest(db, scenarioId, 'passed', resolveAllowedCommits());
      if (!baseline) return null;

      return {
        testId: baseline.id,
        gitCommit: baseline.gitCommit,
        artifacts: findArtifacts(db, baseline.id),
        artifactDir: join(dirname(dbPath), 'artifacts'),
      };
    } finally {
      db?.close();
    }
  }

  private async buildFailureFromBaseline(
    step: ParsedStep,
    stepIndex: number,
    baseline: BaselineContext,
    base: Pick<
      FailurePayload,
      'error' | 'kind' | 'summary' | 'locator' | 'locator_full' | 'url' | 'expected' | 'actual' | 'timeout_ms'
    >,
  ): Promise<FailurePayload> {
    const screenshots = resolveBaselineScreenshots(baseline.artifacts, baseline.artifactDir, stepIndex);

    const htmlArtifact = [...baseline.artifacts].reverse().find((a) => a.filename.endsWith('.html'));
    if (!htmlArtifact) {
      return {
        ...base,
        baseline: { test_id: baseline.testId, commit: baseline.gitCommit, screenshots },
        diff_available: false,
        diff_reason: 'no_html_snapshot',
      };
    }

    const currentHtml = findAttachment(step, 'text/html');
    if (!currentHtml) {
      return {
        ...base,
        baseline: { test_id: baseline.testId, commit: baseline.gitCommit, screenshots },
        diff_available: false,
        diff_reason: 'no_current_html',
      };
    }

    let oldHtml = '';
    try {
      oldHtml = readFileSync(join(baseline.artifactDir, htmlArtifact.filename), 'utf-8');
    } catch {
      return {
        ...base,
        baseline: { test_id: baseline.testId, commit: baseline.gitCommit, screenshots },
        diff_available: false,
        diff_reason: 'read_baseline_failed',
      };
    }

    const currentUrl = extractUrlFromStep(step) ?? 'about:blank';
    let diff = '';
    try {
      diff = await unifiedHtmlDiff({ html: oldHtml, url: 'about:blank' }, { html: currentHtml, url: currentUrl });
    } catch {
      return {
        ...base,
        baseline: { test_id: baseline.testId, commit: baseline.gitCommit, screenshots },
        diff_available: false,
        diff_reason: 'diff_compute_failed',
      };
    }

    return {
      ...base,
      baseline: { test_id: baseline.testId, commit: baseline.gitCommit, screenshots },
      diff_available: true,
      diff,
    };
  }

  private async resolveFailurePayload(
    scenarioId: string | null,
    step: ParsedStep,
    stepIndex: number,
  ): Promise<FailurePayload> {
    const base = this.createBaseFailurePayload(step);
    const htmlSnapshot = findAttachment(step, 'text/html');

    const withSnapshotWhenNoDiff = (payload: FailurePayload): FailurePayload => {
      if (!payload.diff_available && htmlSnapshot) {
        return { ...payload, html_snapshot: htmlSnapshot };
      }
      return payload;
    };

    const dbPath = this.resolveStoreDbPath();
    if (!dbPath) return withSnapshotWhenNoDiff({ ...base, diff_available: false, diff_reason: 'no_store_config' });

    if (!scenarioId) {
      return withSnapshotWhenNoDiff({ ...base, diff_available: false, diff_reason: 'no_baseline' });
    }

    try {
      const baseline = this.loadBaselineContext(dbPath, scenarioId);
      if (!baseline) return withSnapshotWhenNoDiff({ ...base, diff_available: false, diff_reason: 'no_baseline' });
      return withSnapshotWhenNoDiff(await this.buildFailureFromBaseline(step, stepIndex, baseline, base));
    } catch {
      return withSnapshotWhenNoDiff({ ...base, diff_available: false, diff_reason: 'diff_compute_failed' });
    }
  }

  private emit(payload: Record<string, unknown>): void {
    emitLine(this.log, payload);
  }

  private emitRunStart(): void {
    if (this.runStarted) return;
    this.runStarted = true;
    this.emit({
      event_type: 'run_start',
      run_id: this.runId,
    });
  }

  private emitScenarioStart(
    scenario: ParsedScenario,
    scenarioId: string | undefined,
    attempt: number,
  ): void {
    this.emit({
      event_type: 'scenario_start',
      scenario_id: scenarioId,
      attempt,
      name: scenario.name,
      uri: scenario.sourceLocation?.uri,
      line: scenario.sourceLocation?.line,
    });
  }

  private emitScenarioEnd(
    scenarioId: string | undefined,
    status: string,
    attempt: number,
    willBeRetried: boolean,
  ): void {
    const payload: Record<string, unknown> = {
      event_type: 'scenario_end',
      scenario_id: scenarioId,
      attempt,
      status,
    };
    if (willBeRetried) payload.will_be_retried = true;
    this.emit(payload);
  }

  private emitRunEnd(passed: number, failed: number, skipped: number): void {
    this.emit({
      event_type: 'run_end',
      status: failed > 0 ? 'failed' : 'passed',
      scenarios: { passed, failed, skipped },
    });
  }

  private async emitStepResult(
    scenarioId: string | undefined,
    step: ParsedStep,
    idx: number,
  ): Promise<void> {
    const status = normalizeStatus(step.result.status);
    const baseEvent: Record<string, unknown> = {
      event_type: 'step_result',
      scenario_id: scenarioId,
      step_index: idx,
      keyword: step.keyword,
      text: step.text,
      status,
      duration_ms: toDurationMs(step.result.duration),
    };

    if (status === 'failed' || status === 'ambiguous' || status === 'undefined') {
      const failure = await this.resolveFailurePayload(scenarioId ?? null, step, idx);
      this.emit({ ...baseEvent, failure });
      return;
    }

    this.emit(baseEvent);
  }

  private parseAttempt(testCaseStartedId: string): { scenario: ParsedScenario; steps: ParsedStep[]; attempt: number } | null {
    try {
      const attempt = this.eventDataCollector.getTestCaseAttempt(testCaseStartedId);
      const parsed = formatterHelpers.parseTestCaseAttempt({
        snippetBuilder: this.snippetBuilder,
        supportCodeLibrary: this.supportCodeLibrary,
        testCaseAttempt: attempt,
      });
      return {
        scenario: parsed.testCase as ParsedScenario,
        steps: parsed.testSteps as ParsedStep[],
        attempt: attempt.attempt + 1,
      };
    } catch {
      return null;
    }
  }

  private async handleTestCaseStarted(envelope: Envelope): Promise<void> {
    const started = envelope.testCaseStarted;
    if (!started) return;

    const parsed = this.parseAttempt(started.id);
    if (!parsed) return;

    const attemptData = this.eventDataCollector.getTestCaseAttempt(started.id);
    const stepIndexById = new Map<string, number>();
    attemptData.testCase.testSteps.forEach((step, idx) => {
      stepIndexById.set(step.id, idx);
    });

    const scenarioId = toScenarioId(parsed.steps) ?? undefined;
    this.scenarios.set(started.id, {
      scenarioId,
      attempt: parsed.attempt,
      stepIndexById,
    });

    this.emitScenarioStart(parsed.scenario, scenarioId, parsed.attempt);
  }

  private async handleTestStepFinished(envelope: Envelope): Promise<void> {
    const finished = envelope.testStepFinished;
    if (!finished) return;

    const context = this.scenarios.get(finished.testCaseStartedId);
    if (!context) return;

    const parsed = this.parseAttempt(finished.testCaseStartedId);
    if (!parsed) return;

    const stepIndex = context.stepIndexById.get(finished.testStepId);
    if (stepIndex === undefined) return;

    const step = parsed.steps[stepIndex];
    if (!step) return;

    await this.emitStepResult(context.scenarioId, step, stepIndex);
  }

  private handleTestCaseFinished(envelope: Envelope): void {
    const finished = envelope.testCaseFinished;
    if (!finished) return;

    const context = this.scenarios.get(finished.testCaseStartedId);
    const attemptData = this.eventDataCollector.getTestCaseAttempt(finished.testCaseStartedId);
    const status = normalizeStatus(attemptData.worstTestStepResult.status);
    const attempt = context?.attempt ?? attemptData.attempt + 1;
    const scenarioId = context?.scenarioId;

    if (status === 'passed') this.passed += 1;
    else if (status === 'skipped') this.skipped += 1;
    else this.failed += 1;

    this.emitScenarioEnd(scenarioId, status, attempt, finished.willBeRetried);
    this.scenarios.delete(finished.testCaseStartedId);
  }

  private handleTestRunFinished(): void {
    this.emitRunEnd(this.passed, this.failed, this.skipped);
  }

  private async handleEnvelope(envelope: Envelope): Promise<void> {
    if (envelope.testRunStarted) {
      this.emitRunStart();
      return;
    }

    if (envelope.testCaseStarted) {
      await this.handleTestCaseStarted(envelope);
      return;
    }

    if (envelope.testStepFinished) {
      await this.handleTestStepFinished(envelope);
      return;
    }

    if (envelope.testCaseFinished) {
      this.handleTestCaseFinished(envelope);
      return;
    }

    if (envelope.testRunFinished) {
      this.handleTestRunFinished();
    }
  }

  async finished(): Promise<void> {
    await this.processing;
    await super.finished();
  }
}
