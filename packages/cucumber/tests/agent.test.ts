import { formatterHelpers } from '@cucumber/cucumber';
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AgentFormatter, { buildStructuredFailure } from '../src/agent';

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

type AttemptMap = Record<
  string,
  {
    attempt: number;
    testCase: { testSteps: Array<{ id: string }> };
    worstTestStepResult: { status: string };
  }
>;

function createFormatterHarness(attempts: AttemptMap): {
  emitter: EventEmitter;
  logs: Array<Record<string, unknown>>;
  formatter: AgentFormatter;
} {
  const emitter = new EventEmitter();
  const logs: Array<Record<string, unknown>> = [];
  const formatter = new AgentFormatter({
    colorFns: {} as any,
    cwd: process.cwd(),
    eventBroadcaster: emitter as any,
    eventDataCollector: {
      getTestCaseAttempt: (id: string) => attempts[id],
    } as any,
    log: (line: string | Uint8Array) => {
      const text = typeof line === 'string' ? line : Buffer.from(line).toString('utf8');
      const trimmed = text.trim();
      if (!trimmed) return;
      logs.push(JSON.parse(trimmed) as Record<string, unknown>);
    },
    snippetBuilder: {} as any,
    stream: { write: () => {} } as any,
    supportCodeLibrary: {} as any,
    cleanup: async () => {},
    parsedArgvOptions: {} as any,
  });

  return { emitter, logs, formatter };
}

describe('buildStructuredFailure', () => {
  it('extracts playwright-oriented fields from failure message', () => {
    const step = {
      keyword: 'Then ',
      text: 'the page contains text "Hi world"',
      result: {
        status: 'FAILED',
        message: [
          'Error: expect(locator).toBeVisible() failed',
          '',
          "Locator: locator('text=/Hi world/i').first()",
          'Expected: visible',
          'Timeout: 5000ms',
          'Error: element(s) not found',
        ].join('\n'),
      },
      attachments: [],
    };

    const structured = buildStructuredFailure(step as any);
    expect(structured.kind).toBe('assertion');
    expect(structured.summary).toBe('element(s) not found');
    expect(structured.locator).toBe('text=/Hi world/i');
    expect(structured.locator_full).toBe("locator('text=/Hi world/i').first()");
    expect(structured.expected).toBe('visible');
    expect(structured.timeout_ms).toBe(5000);
  });

  it('prefers url attachment when present', () => {
    const step = {
      keyword: 'Then ',
      text: 'foo',
      result: { status: 'FAILED', message: 'Error: no\nURL: http://wrong/path' },
      attachments: [{ mediaType: 'text/x-letsrunit-url', body: 'https://example.com/ok?x=1' }],
    };

    const structured = buildStructuredFailure(step as any);
    expect(structured.kind).toBe('unknown');
    expect(structured.url).toBe('/ok?x=1');
  });

  it('keeps simplified and full locator forms', () => {
    const step = {
      keyword: 'Then ',
      text: 'foo',
      result: {
        status: 'FAILED',
        message: [
          "Locator: locator('role=button [name=\"Use Item\"i]').or(locator('role=button').filter({ hasText: 'Use Item' })).first()",
          'Error: element(s) not found',
        ].join('\n'),
      },
      attachments: [],
    };

    const structured = buildStructuredFailure(step as any);
    expect(structured.locator).toBe('role=button [name="Use Item"i]');
    expect(structured.locator_full).toBe(
      "locator('role=button [name=\"Use Item\"i]').or(locator('role=button').filter({ hasText: 'Use Item' })).first()",
    );
  });
});

describe('agent formatter payload shape', () => {
  let parseSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    parseSpy = vi.spyOn(formatterHelpers, 'parseTestCaseAttempt').mockImplementation(() => {
      return {
        testCase: { name: 'Scenario name', sourceLocation: { uri: 'features/a.feature', line: 3 } },
        testSteps: [
          {
            keyword: 'Given ',
            text: 'foo',
            result: {
              status: 'FAILED',
              duration: { seconds: 1, nanos: 0 },
              message: [
                'Error: \u001b[2mexpect(\u001b[22m\u001b[31mlocator\u001b[39m\u001b[2m).\u001b[22mtoBeVisible() failed',
                "Locator: locator('role=button [name=\"Use Item\"i]').or(locator('role=button')).first()",
                'Expected: visible',
                'Timeout: 5000ms',
                'Error: element(s) not found',
              ].join('\n'),
            },
            attachments: [{ mediaType: 'text/html', body: '<html><body><div>snapshot</div></body></html>' }],
          },
        ],
      } as any;
    });
  });

  afterEach(() => {
    parseSpy.mockRestore();
  });

  it('emits compact fields and keeps run_id only in run_start', async () => {
    const attempts: AttemptMap = {
      start1: {
        attempt: 0,
        testCase: { testSteps: [{ id: 'step1' }] },
        worstTestStepResult: { status: 'PASSED' },
      },
    };
    const { emitter, logs, formatter } = createFormatterHarness(attempts);

    emitter.emit('envelope', { testRunStarted: {} });
    emitter.emit('envelope', { testCaseStarted: { id: 'start1' } });
    emitter.emit('envelope', {
      testStepFinished: {
        testCaseStartedId: 'start1',
        testStepId: 'step1',
      },
    });

    await flushMicrotasks();
    expect(logs.some((entry) => entry.event_type === 'step_result')).toBe(true);

    emitter.emit('envelope', { testCaseFinished: { testCaseStartedId: 'start1', willBeRetried: false } });
    emitter.emit('envelope', { testRunFinished: {} });

    await formatter.finished();

    const runStart = logs.find((entry) => entry.event_type === 'run_start');
    expect(runStart).toBeDefined();
    expect(runStart?.run_id).toEqual(expect.any(String));

    const nonRunStart = logs.filter((entry) => entry.event_type !== 'run_start');
    for (const entry of nonRunStart) {
      expect(entry.run_id).toBeUndefined();
    }

    for (const entry of logs) {
      expect(entry.schema_version).toBeUndefined();
      expect(entry.timestamp).toBeUndefined();
      expect(entry.event_id).toBeUndefined();
      expect(entry.sequence).toBeUndefined();
    }

    const scenarioEnd = logs.find((entry) => entry.event_type === 'scenario_end');
    expect(scenarioEnd?.will_be_retried).toBeUndefined();

    const stepResult = logs.find((entry) => entry.event_type === 'step_result');
    const failure = stepResult?.failure as Record<string, unknown> | undefined;
    expect(failure).toBeDefined();
    expect(stepResult?.attempt).toBeUndefined();
    expect(failure?.error).toContain('expect(locator).toBeVisible() failed');
    expect(String(failure?.error)).not.toContain('\u001b[');
    expect(failure?.kind).toBe('assertion');
    expect(failure?.locator).toBe('role=button [name="Use Item"i]');
    expect(failure?.locator_full).toBe("locator('role=button [name=\"Use Item\"i]').or(locator('role=button')).first()");
    expect(failure?.summary).toBe('element(s) not found');
    expect(failure?.html_snapshot).toBe('<html><body><div>snapshot</div></body></html>');
    expect(failure?.error_raw).toBeUndefined();
    expect(failure?.error_structured).toBeUndefined();
  });

  it('emits will_be_retried only when true', async () => {
    const attempts: AttemptMap = {
      start2: {
        attempt: 0,
        testCase: { testSteps: [{ id: 'step1' }] },
        worstTestStepResult: { status: 'SKIPPED' },
      },
    };
    const { emitter, logs, formatter } = createFormatterHarness(attempts);

    emitter.emit('envelope', { testRunStarted: {} });
    emitter.emit('envelope', { testCaseStarted: { id: 'start2' } });
    emitter.emit('envelope', { testCaseFinished: { testCaseStartedId: 'start2', willBeRetried: true } });
    emitter.emit('envelope', { testRunFinished: {} });

    await formatter.finished();

    const scenarioEnd = logs.find((entry) => entry.event_type === 'scenario_end');
    expect(scenarioEnd?.will_be_retried).toBe(true);
  });
});
