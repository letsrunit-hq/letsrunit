import { AttachmentContentEncoding, type Envelope, TestStepResultStatus } from '@cucumber/messages';
import { normalizeSteps } from '@letsrunit/gherkin';
import {
  computeExampleRowId,
  computeFeatureId,
  computeOutlineId,
  computeRuleId,
  computeScenarioId,
  computeStepId,
  finaliseTest,
  insertArtifact,
  insertRun,
  insertTest,
  openStore,
  upsertFeature,
  upsertScenario,
  upsertScenarioStep,
  upsertStep,
} from '@letsrunit/store';
import { chain } from '@letsrunit/utils';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_DIR = '.letsrunit';

type AstStep = {
  keyword: string;
};

type ScenarioAstMeta = {
  ruleKey?: string;
  isOutline: boolean;
  outlineStepIds?: string[];
};

type ExampleRowMeta = {
  values: string[];
  index: number;
};

type FeatureAstMeta = {
  uri: string;
  name: string;
  scenarioByAstId: Map<string, ScenarioAstMeta>;
  exampleRowByAstId: Map<string, ExampleRowMeta>;
};

type PickleEntry = {
  pickleId: string;
  uri: string;
  name: string;
  scenarioId: string;
  steps: { id: string; text: string }[];
  ruleKey?: string;
  outline?: string;
  exampleRow?: string;
  exampleIndex?: number;
  featureId?: string;
};

type FeatureBucket = {
  uri: string;
  name: string;
  persisted: boolean;
  pickles: PickleEntry[];
};

type TestCaseEntry = {
  scenarioId: string;
  stepIndexByTestStepId: Map<string, number>;
};

type TestEntry = {
  testId: string;
  scenarioId: string;
  stepIndexByTestStepId: Map<string, number>;
};

type FailureInfo = {
  failedStepIndex: number;
  error: string | undefined;
};

interface GherkinScenarioNode {
  id: string;
  steps?: ReadonlyArray<{
    id: string;
    keyword: string;
    text: string;
    docString?: { content: string };
    dataTable?: { rows: ReadonlyArray<{ cells: ReadonlyArray<{ value: string }> }> };
  }>;
  examples?: ReadonlyArray<{
    tableBody?: ReadonlyArray<{ id: string; cells?: ReadonlyArray<{ value: string }> }>;
  }>;
}

type OnMessage = (key: 'message', handler: (value: Envelope) => void) => void;

type RecorderContext = {
  db: ReturnType<typeof openStore>;
  runId: string;
  artifactDir: string;
  astStepMap: Map<string, AstStep>;
  featureAstByUri: Map<string, FeatureAstMeta>;
  featureBuckets: Map<string, FeatureBucket>;
  pickleMap: Map<string, PickleEntry>;
  testCaseMap: Map<string, TestCaseEntry>;
  testMap: Map<string, TestEntry>;
  pendingFailures: Map<string, FailureInfo>;
};

function ensureDirectory(path: string): void {
  if (existsSync(path)) {
    if (statSync(path).isDirectory()) return;
    throw new Error(`Path "${path}" exists and is not a directory`);
  }

  mkdirSync(path, { recursive: true });
}

function mimeToExt(mediaType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'text/html': 'html',
    'text/plain': 'txt',
    'application/json': 'json',
    'application/pdf': 'pdf',
  };
  return map[mediaType] ?? 'bin';
}

async function hashBytes(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizeScenarioTemplateStepIds(scenario: GherkinScenarioNode): string[] {
  const normalized = normalizeSteps(
    (scenario.steps ?? []).map((step) => ({
      keyword: step.keyword,
      text: step.text,
      docString: step.docString,
      dataTable: step.dataTable,
    })),
  );
  return normalized.map((text) => computeStepId(text));
}

function getFeatureBucket(featureBuckets: Map<string, FeatureBucket>, uri: string, name: string): FeatureBucket {
  let bucket = featureBuckets.get(uri);
  if (!bucket) {
    bucket = { uri, name, persisted: false, pickles: [] };
    featureBuckets.set(uri, bucket);
  }

  if (name && !bucket.name) {
    bucket.name = name;
  }

  return bucket;
}

function ensureFeaturePersisted(db: ReturnType<typeof openStore>, bucket: FeatureBucket): void {
  if (bucket.persisted) return;

  const ruleScenarios = new Map<string, string[]>();
  for (const pickle of bucket.pickles) {
    if (!pickle.ruleKey) continue;
    const scenarioIds = ruleScenarios.get(pickle.ruleKey) ?? [];
    scenarioIds.push(pickle.scenarioId);
    ruleScenarios.set(pickle.ruleKey, scenarioIds);
  }

  const ruleByKey = new Map<string, string>();
  for (const [key, scenarioIds] of ruleScenarios) {
    ruleByKey.set(key, computeRuleId(scenarioIds));
  }

  const featureId = computeFeatureId(bucket.pickles.map((p) => p.scenarioId));
  upsertFeature(db, featureId, bucket.uri, bucket.name);

  bucket.pickles.forEach((pickle, scenarioIndex) => {
    pickle.featureId = featureId;
    const rule = pickle.ruleKey ? ruleByKey.get(pickle.ruleKey) : undefined;

    upsertScenario(db, pickle.scenarioId, featureId, scenarioIndex, pickle.name, {
      rule,
      outline: pickle.outline,
      exampleRow: pickle.exampleRow,
      exampleIndex: pickle.exampleIndex,
    });

    pickle.steps.forEach((step, stepIndex) => {
      upsertStep(db, step.id, step.text);
      upsertScenarioStep(db, pickle.scenarioId, stepIndex, step.id);
    });
  });

  bucket.persisted = true;
}

function normalizeRowValues(row?: { cells?: ReadonlyArray<{ value: string }> }): string[] {
  if (!row?.cells?.length) return [];
  return row.cells.map((cell) => cell.value.trim());
}

function registerScenarioAst(
  scenario: GherkinScenarioNode,
  scenarioByAstId: Map<string, ScenarioAstMeta>,
  exampleRowByAstId: Map<string, ExampleRowMeta>,
  astStepMap: Map<string, AstStep>,
  ruleKey?: string,
): void {
  const isOutline = (scenario.examples?.length ?? 0) > 0;
  const outlineStepIds = isOutline ? normalizeScenarioTemplateStepIds(scenario) : undefined;

  scenarioByAstId.set(scenario.id, {
    ruleKey,
    isOutline,
    outlineStepIds,
  });

  for (const step of scenario.steps ?? []) {
    astStepMap.set(step.id, { keyword: step.keyword.trim() });
  }

  let rowIndex = 0;
  for (const examples of scenario.examples ?? []) {
    for (const row of examples.tableBody ?? []) {
      exampleRowByAstId.set(row.id, {
        values: normalizeRowValues(row),
        index: rowIndex++,
      });
    }
  }
}

function createRecorderContext(directory?: string): RecorderContext {
  const runDir = directory ?? DEFAULT_DIR;
  const artifactDir = join(runDir, 'artifacts');
  ensureDirectory(runDir);
  ensureDirectory(artifactDir);

  const dbPath = join(runDir, 'letsrunit.db');
  const db = openStore(dbPath);

  const runId = uuidv4();
  let gitCommit: string | null = null;
  try {
    gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {}
  insertRun(db, runId, gitCommit, Date.now());

  return {
    db,
    runId,
    artifactDir,
    astStepMap: new Map<string, AstStep>(),
    featureAstByUri: new Map<string, FeatureAstMeta>(),
    featureBuckets: new Map<string, FeatureBucket>(),
    pickleMap: new Map<string, PickleEntry>(),
    testCaseMap: new Map<string, TestCaseEntry>(),
    testMap: new Map<string, TestEntry>(),
    pendingFailures: new Map<string, FailureInfo>(),
  };
}

function handleGherkinDocument(envelope: Envelope, context: RecorderContext): boolean {
  const doc = envelope.gherkinDocument;
  if (!doc) return false;

  const uri = doc.uri ?? '';
  const feature = doc.feature;
  if (!feature) return true;

  const scenarioByAstId = new Map<string, ScenarioAstMeta>();
  const exampleRowByAstId = new Map<string, ExampleRowMeta>();
  let ruleIndex = 0;

  for (const child of feature.children ?? []) {
    if (child.background) {
      for (const step of child.background.steps ?? []) {
        context.astStepMap.set(step.id, { keyword: step.keyword.trim() });
      }
    }

    if (child.scenario) {
      registerScenarioAst(child.scenario, scenarioByAstId, exampleRowByAstId, context.astStepMap);
    }

    if (child.rule) {
      const currentRuleIndex = ruleIndex++;

      for (const ruleChild of child.rule.children ?? []) {
        if (ruleChild.background) {
          for (const step of ruleChild.background.steps ?? []) {
            context.astStepMap.set(step.id, { keyword: step.keyword.trim() });
          }
        }

        if (ruleChild.scenario) {
          registerScenarioAst(
            ruleChild.scenario,
            scenarioByAstId,
            exampleRowByAstId,
            context.astStepMap,
            `${uri}::${currentRuleIndex}`,
          );
        }
      }
    }
  }

  context.featureAstByUri.set(uri, {
    uri,
    name: feature.name ?? '',
    scenarioByAstId,
    exampleRowByAstId,
  });

  getFeatureBucket(context.featureBuckets, uri, feature.name ?? '');
  return true;
}

function handlePickle(envelope: Envelope, context: RecorderContext): boolean {
  const pickle = envelope.pickle;
  if (!pickle) return false;

  const featureMeta = context.featureAstByUri.get(pickle.uri);
  const bucket = getFeatureBucket(context.featureBuckets, pickle.uri, featureMeta?.name ?? '');

  const normalizedPickleSteps = normalizeSteps(
    pickle.steps.map((pickleStep) => ({
      keyword: context.astStepMap.get(pickleStep.astNodeIds[0] ?? '')?.keyword ?? 'Given',
      text: pickleStep.text,
      docString: pickleStep.argument?.docString ? { content: pickleStep.argument.docString.content } : undefined,
      dataTable: pickleStep.argument?.dataTable,
    })),
  );

  const steps = normalizedPickleSteps.map((text) => ({ id: computeStepId(text), text }));
  const scenarioId = computeScenarioId(steps.map((s) => s.id));
  const scenarioAstId = pickle.astNodeIds.find((id) => featureMeta?.scenarioByAstId.has(id));
  const scenarioMeta = scenarioAstId ? featureMeta?.scenarioByAstId.get(scenarioAstId) : undefined;

  let outline: string | undefined;
  let exampleRow: string | undefined;
  let exampleIndex: number | undefined;

  if (scenarioMeta?.isOutline) {
    outline = computeOutlineId(scenarioMeta.outlineStepIds ?? []);
    const rowAstId = pickle.astNodeIds.find((id) => featureMeta?.exampleRowByAstId.has(id));
    const rowMeta = rowAstId ? featureMeta?.exampleRowByAstId.get(rowAstId) : undefined;

    if (rowMeta) {
      exampleIndex = rowMeta.index;
      exampleRow = computeExampleRowId(rowMeta.values);
    }
  }

  const entry: PickleEntry = {
    pickleId: pickle.id,
    uri: pickle.uri,
    name: pickle.name,
    scenarioId,
    steps,
    ruleKey: scenarioMeta?.ruleKey,
    outline,
    exampleRow,
    exampleIndex,
  };

  context.pickleMap.set(pickle.id, entry);
  bucket.pickles.push(entry);
  return true;
}

function handleTestCase(envelope: Envelope, context: RecorderContext): boolean {
  const testCase = envelope.testCase;
  if (!testCase) return false;

  const pickleEntry = context.pickleMap.get(testCase.pickleId);
  if (!pickleEntry) return true;

  const bucket = context.featureBuckets.get(pickleEntry.uri);
  if (!bucket) return true;

  ensureFeaturePersisted(context.db, bucket);

  const stepIndexByTestStepId = new Map<string, number>();
  let pickleStepIndex = 0;

  for (const testStep of testCase.testSteps) {
    if (testStep.pickleStepId !== undefined && testStep.pickleStepId !== '') {
      stepIndexByTestStepId.set(testStep.id, pickleStepIndex++);
    }
  }

  context.testCaseMap.set(testCase.id, {
    scenarioId: pickleEntry.scenarioId,
    stepIndexByTestStepId,
  });
  return true;
}

function handleTestCaseStarted(envelope: Envelope, context: RecorderContext): boolean {
  const started = envelope.testCaseStarted;
  if (!started) return false;

  const testCaseEntry = context.testCaseMap.get(started.testCaseId);
  if (!testCaseEntry) return true;

  const testId = uuidv4();
  insertTest(context.db, testId, context.runId, testCaseEntry.scenarioId, Date.now());

  context.testMap.set(started.id, {
    testId,
    scenarioId: testCaseEntry.scenarioId,
    stepIndexByTestStepId: testCaseEntry.stepIndexByTestStepId,
  });
  return true;
}

function handleTestStepFinished(envelope: Envelope, context: RecorderContext): boolean {
  const finished = envelope.testStepFinished;
  if (!finished) return false;

  const status = finished.testStepResult.status;
  const isFailing =
    status === TestStepResultStatus.FAILED ||
    status === TestStepResultStatus.AMBIGUOUS ||
    status === TestStepResultStatus.UNDEFINED;

  if (isFailing && !context.pendingFailures.has(finished.testCaseStartedId)) {
    const testEntry = context.testMap.get(finished.testCaseStartedId);
    const failedStepIndex = testEntry?.stepIndexByTestStepId.get(finished.testStepId);
    if (failedStepIndex === undefined) return true;

    context.pendingFailures.set(finished.testCaseStartedId, {
      failedStepIndex,
      error: finished.testStepResult.message,
    });
  }
  return true;
}

function handleTestCaseFinished(envelope: Envelope, context: RecorderContext): boolean {
  const finished = envelope.testCaseFinished;
  if (!finished) return false;

  const failure = context.pendingFailures.get(finished.testCaseStartedId);
  context.pendingFailures.delete(finished.testCaseStartedId);

  let status: string;
  if (finished.willBeRetried) {
    status = 'running';
  } else if (failure) {
    status = 'failed';
  } else {
    status = 'passed';
  }

  finaliseTest(
    context.db,
    context.testMap.get(finished.testCaseStartedId)?.testId ?? '',
    status,
    failure?.failedStepIndex,
    failure?.error,
  );
  return true;
}

async function persistAttachment(
  attachment: NonNullable<Envelope['attachment']>,
  context: RecorderContext,
): Promise<void> {
  const bytes =
    attachment.contentEncoding === AttachmentContentEncoding.BASE64
      ? Buffer.from(attachment.body, 'base64')
      : Buffer.from(attachment.body, 'utf-8');
  const ext = mimeToExt(attachment.mediaType);
  const hash = await hashBytes(new Uint8Array(bytes));

  const filename = `${hash}.${ext}`;
  const filepath = join(context.artifactDir, filename);

  if (existsSync(filepath)) {
    const now = new Date();
    await utimes(filepath, now, now);
  } else {
    await writeFile(filepath, bytes);
  }

  const testCaseStartedId = attachment.testCaseStartedId;
  const testStepId = attachment.testStepId;
  if (!testCaseStartedId || !testStepId) return;

  const testEntry = context.testMap.get(testCaseStartedId);
  if (!testEntry) return;

  const stepIndex = testEntry.stepIndexByTestStepId.get(testStepId);
  if (stepIndex === undefined) return;

  insertArtifact(context.db, uuidv4(), testEntry.testId, stepIndex, filename);
}

function handleAttachment(envelope: Envelope, context: RecorderContext): boolean {
  const attachment = envelope.attachment;
  if (!attachment) return false;
  void persistAttachment(attachment, context).catch(() => {});
  return true;
}

const handleEnvelope = chain<[Envelope, RecorderContext]>(
  handleGherkinDocument,
  handlePickle,
  handleTestCase,
  handleTestCaseStarted,
  handleTestStepFinished,
  handleTestCaseFinished,
  handleAttachment,
);

function startStoreRecorder({ on, directory }: { on: OnMessage; directory?: string }): void {
  const context = createRecorderContext(directory);
  on('message', (envelope: Envelope) => {
    void handleEnvelope(envelope, context);
  });
}

type StorePluginOptions = {
  directory?: string;
};

export default {
  type: 'plugin' as const,
  optionsKey: 'letsrunitStore' as const,
  coordinator({
    on,
    options,
    operation,
  }: {
    on: (key: 'message', handler: (value: Envelope) => void) => void;
    options?: StorePluginOptions;
    operation: 'loadSources' | 'loadSupport' | 'runCucumber';
  }) {
    if (operation !== 'runCucumber') return;
    startStoreRecorder({ on, directory: options?.directory });
  },
};
