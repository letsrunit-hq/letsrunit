export type StreamEventType =
  | 'feature_snapshot'
  | 'test_started'
  | 'step_finished'
  | 'attachment'
  | 'test_finished'
  | 'run_finished';

export type StreamEvent<TPayload = Record<string, unknown>> = {
  runId: string;
  sessionId: string;
  seq: number;
  ts: string;
  type: StreamEventType;
  payload: TPayload;
};

export type FeatureSnapshotPayload = {
  feature: string;
  uri: string;
  name: string;
};

export type TestStartedPayload = {
  testCaseStartedId: string;
  testCaseId: string;
  scenarioId?: string;
  startedAt: number;
};

export type StepFinishedPayload = {
  testCaseStartedId: string;
  testStepId: string;
  stepIndex?: number;
  status?: number | string;
  message?: string;
  duration?: { seconds?: number; nanos?: number };
};

export type AttachmentPayload = {
  testCaseStartedId?: string;
  testStepId?: string;
  stepIndex?: number;
  mediaType: string;
  contentEncoding: number | string;
  body: string;
};

export type TestFinishedPayload = {
  testCaseStartedId: string;
  status: 'passed' | 'failed' | 'running';
  failedStepIndex?: number;
  error?: string;
  willBeRetried?: boolean;
};

export type RunFinishedPayload = {
  finishedAt: number;
};
