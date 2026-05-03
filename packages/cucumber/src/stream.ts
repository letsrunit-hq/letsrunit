import { AttachmentContentEncoding, type Envelope, TestStepResultStatus } from '@cucumber/messages';
import { v4 as uuidv4 } from 'uuid';
import { extractFeatureAst, parsePickle, parseTestCase, type AstStep, type FailureInfo, type FeatureAstMeta, type PickleEntry, type TestCaseEntry } from './lib/cucumber-state';
import type { AttachmentPayload, FeatureSnapshotPayload, StepFinishedPayload, StreamEvent, StreamEventType, TestFinishedPayload, TestStartedPayload } from './lib/stream-events';
import { type StreamTransport, WebSocketTransport } from './lib/transport';

type OnMessage = (key: 'message', handler: (value: Envelope) => void) => void;

type StreamPluginOptions = {
  endpoint?: string;
  token?: string;
  sessionId?: string;
  enabled?: boolean;
  transport?: StreamTransport;
};

type StreamContext = {
  runId: string;
  sessionId: string;
  seq: number;
  transport: StreamTransport;
  astStepMap: Map<string, AstStep>;
  featureAstByUri: Map<string, FeatureAstMeta>;
  pickleMap: Map<string, PickleEntry>;
  testCaseMap: Map<string, TestCaseEntry>;
  pendingFailures: Map<string, FailureInfo>;
  featureSent: boolean;
};

function resolveTransport(options?: StreamPluginOptions): StreamTransport {
  if (options?.transport) return options.transport;
  if (!options?.endpoint) {
    throw new Error('Missing stream endpoint');
  }

  return new WebSocketTransport({
    endpoint: options.endpoint,
    token: options.token,
  });
}

function shouldStart(options?: StreamPluginOptions): boolean {
  if (options?.enabled === false) return false;
  if (options?.transport) return true;
  return typeof options?.endpoint === 'string' && options.endpoint.length > 0;
}

function statusFromFailure(failure?: FailureInfo, willBeRetried?: boolean): 'passed' | 'failed' | 'running' {
  if (willBeRetried) return 'running';
  return failure ? 'failed' : 'passed';
}

function nextEvent<TPayload extends Record<string, unknown>>(
  context: StreamContext,
  type: StreamEventType,
  payload: TPayload,
): StreamEvent<TPayload> {
  context.seq += 1;
  return {
    runId: context.runId,
    sessionId: context.sessionId,
    seq: context.seq,
    ts: new Date().toISOString(),
    type,
    payload,
  };
}

async function emit<TPayload extends Record<string, unknown>>(
  context: StreamContext,
  type: StreamEventType,
  payload: TPayload,
): Promise<void> {
  await context.transport.send([nextEvent(context, type, payload)]);
}

async function handleSource(envelope: Envelope, context: StreamContext): Promise<boolean> {
  if (context.featureSent) return false;

  const source = envelope.source;
  if (!source?.data) return false;

  const payload: FeatureSnapshotPayload = {
    feature: source.data,
    uri: source.uri ?? 'inline.feature',
    name: '',
  };
  context.featureSent = true;
  await emit(context, 'feature_snapshot', payload);
  return true;
}

async function handleGherkinDocument(envelope: Envelope, context: StreamContext): Promise<boolean> {
  const featureAst = extractFeatureAst(envelope, context.astStepMap);
  if (!featureAst) return false;

  context.featureAstByUri.set(featureAst.uri, featureAst);

  if (!context.featureSent) {
    const payload: FeatureSnapshotPayload = {
      feature: JSON.stringify(envelope.gherkinDocument),
      uri: featureAst.uri,
      name: featureAst.name,
    };
    context.featureSent = true;
    await emit(context, 'feature_snapshot', payload);
  }

  return true;
}

function handlePickle(envelope: Envelope, context: StreamContext): boolean {
  const parsed = parsePickle(envelope, context.featureAstByUri, context.astStepMap);
  if (!parsed) return false;
  context.pickleMap.set(parsed.pickle.pickleId, parsed.pickle);
  return true;
}

function handleTestCase(envelope: Envelope, context: StreamContext): boolean {
  const testCase = envelope.testCase;
  if (!testCase) return false;
  const parsed = parseTestCase(envelope, context.pickleMap);
  if (!parsed) return true;
  context.testCaseMap.set(testCase.id, parsed);
  return true;
}

async function handleTestCaseStarted(envelope: Envelope, context: StreamContext): Promise<boolean> {
  const started = envelope.testCaseStarted;
  if (!started) return false;

  const testCaseEntry = context.testCaseMap.get(started.testCaseId);
  const payload: TestStartedPayload = {
    testCaseStartedId: started.id,
    testCaseId: started.testCaseId,
    scenarioId: testCaseEntry?.scenarioId,
    startedAt: Date.now(),
  };
  await emit(context, 'test_started', payload);
  return true;
}

async function handleTestStepFinished(envelope: Envelope, context: StreamContext): Promise<boolean> {
  const finished = envelope.testStepFinished;
  if (!finished) return false;

  const testCaseEntry = context.testCaseMap.get(finished.testCaseId);
  const stepIndex = testCaseEntry?.stepIndexByTestStepId.get(finished.testStepId);
  const payload: StepFinishedPayload = {
    testCaseStartedId: finished.testCaseStartedId,
    testStepId: finished.testStepId,
    stepIndex,
    status: finished.testStepResult.status,
    message: finished.testStepResult.message,
    duration: finished.testStepResult.duration,
  };
  await emit(context, 'step_finished', payload);

  const status = finished.testStepResult.status;
  const isFailing =
    status === TestStepResultStatus.FAILED ||
    status === TestStepResultStatus.AMBIGUOUS ||
    status === TestStepResultStatus.UNDEFINED;

  if (isFailing && !context.pendingFailures.has(finished.testCaseStartedId)) {
    context.pendingFailures.set(finished.testCaseStartedId, {
      failedStepIndex: stepIndex ?? -1,
      error: finished.testStepResult.message,
    });
  }

  return true;
}

async function handleAttachment(envelope: Envelope, context: StreamContext): Promise<boolean> {
  const attachment = envelope.attachment;
  if (!attachment) return false;

  if (attachment.mediaType === 'text/x-letsrunit-url') return true;

  const testCaseStartedId = attachment.testCaseStartedId;
  const testStepId = attachment.testStepId;
  const testCaseId = envelope.testCase?.id;
  const stepIndex =
    testCaseId && testStepId ? context.testCaseMap.get(testCaseId)?.stepIndexByTestStepId.get(testStepId) : undefined;

  const payload: AttachmentPayload = {
    testCaseStartedId,
    testStepId,
    stepIndex,
    mediaType: attachment.mediaType,
    contentEncoding: attachment.contentEncoding ?? AttachmentContentEncoding.IDENTITY,
    body: attachment.body,
  };

  await emit(context, 'attachment', payload);
  return true;
}

async function handleTestCaseFinished(envelope: Envelope, context: StreamContext): Promise<boolean> {
  const finished = envelope.testCaseFinished;
  if (!finished) return false;

  const failure = context.pendingFailures.get(finished.testCaseStartedId);
  context.pendingFailures.delete(finished.testCaseStartedId);

  const payload: TestFinishedPayload = {
    testCaseStartedId: finished.testCaseStartedId,
    status: statusFromFailure(failure, finished.willBeRetried),
    failedStepIndex: failure?.failedStepIndex,
    error: failure?.error,
    willBeRetried: finished.willBeRetried,
  };

  await emit(context, 'test_finished', payload);
  return true;
}

async function handleRunFinished(envelope: Envelope, context: StreamContext): Promise<boolean> {
  if (!envelope.testRunFinished) return false;
  await emit(context, 'run_finished', { finishedAt: Date.now() });
  await context.transport.close();
  return true;
}

async function handleEnvelope(envelope: Envelope, context: StreamContext): Promise<void> {
  await handleSource(envelope, context);
  await handleGherkinDocument(envelope, context);
  handlePickle(envelope, context);
  handleTestCase(envelope, context);
  await handleTestCaseStarted(envelope, context);
  await handleTestStepFinished(envelope, context);
  await handleAttachment(envelope, context);
  await handleTestCaseFinished(envelope, context);
  await handleRunFinished(envelope, context);
}

function startStreamRecorder({ on, options }: { on: OnMessage; options?: StreamPluginOptions }): void {
  const context: StreamContext = {
    runId: uuidv4(),
    sessionId: options?.sessionId ?? uuidv4(),
    seq: 0,
    transport: resolveTransport(options),
    astStepMap: new Map(),
    featureAstByUri: new Map(),
    pickleMap: new Map(),
    testCaseMap: new Map(),
    pendingFailures: new Map(),
    featureSent: false,
  };

  on('message', (envelope: Envelope) => {
    void handleEnvelope(envelope, context).catch(() => {});
  });
}

export default {
  type: 'plugin' as const,
  optionsKey: 'letsrunitStream' as const,
  coordinator({ on, options, operation }: { on: OnMessage; options?: StreamPluginOptions; operation: string }) {
    if (operation !== 'runCucumber') return;
    if (!shouldStart(options)) return;
    startStreamRecorder({ on, options });
  },
};
