import { AttachmentContentEncoding, type Envelope, TestStepResultStatus } from '@cucumber/messages';
import {
  computeFeatureId,
  computeRuleId,
  computeScenarioId,
  computeStepId,
  normalizeSteps,
} from '@letsrunit/gherkin';
import {
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
import {
  extractFeatureAst,
  parsePickle,
  parseTestCase,
  type AstStep,
  type FailureInfo,
  type FeatureAstMeta,
  type PickleEntry as ParsedPickleEntry,
  type TestCaseEntry,
} from './lib/cucumber-state';
import { clearConfiguredStoreDirectory, setConfiguredRunId, setConfiguredStoreDirectory } from './store-config';

const DEFAULT_DIR = '.letsrunit';

type PickleEntry = ParsedPickleEntry & {
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

type TestEntry = {
  testId: string;
  scenarioId: string;
  stepIndexByTestStepId: Map<string, number>;
};

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
    gitCommit = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {}
  insertRun(db, runId, gitCommit, Date.now());
  setConfiguredRunId(runId);

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
  const featureAst = extractFeatureAst(envelope, context.astStepMap);
  if (!featureAst) return false;

  context.featureAstByUri.set(featureAst.uri, featureAst);
  getFeatureBucket(context.featureBuckets, featureAst.uri, featureAst.name);
  return true;
}

function handlePickle(envelope: Envelope, context: RecorderContext): boolean {
  const parsed = parsePickle(envelope, context.featureAstByUri, context.astStepMap);
  if (!parsed) return false;

  const bucket = getFeatureBucket(context.featureBuckets, parsed.pickle.uri, context.featureAstByUri.get(parsed.pickle.uri)?.name ?? '');
  context.pickleMap.set(parsed.pickle.pickleId, parsed.pickle);
  bucket.pickles.push(parsed.pickle);
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

  const parsed = parseTestCase(envelope, context.pickleMap);
  if (!parsed) return true;

  context.testCaseMap.set(testCase.id, {
    scenarioId: parsed.scenarioId,
    stepIndexByTestStepId: parsed.stepIndexByTestStepId,
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
  // Reporter-only metadata; never persist to artifact storage.
  if (attachment.mediaType === 'text/x-letsrunit-url') return;

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
  enabled?: boolean;
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
    if (options?.enabled === false) {
      clearConfiguredStoreDirectory();
      return;
    }

    setConfiguredStoreDirectory(options?.directory);
    startStoreRecorder({ on, directory: options?.directory });
  },
};
