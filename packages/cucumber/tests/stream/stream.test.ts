import type { Envelope } from '@cucumber/messages';
import { beforeEach, describe, expect, it } from 'vitest';
import streamPlugin from '../../src/stream';
import type { StreamEvent } from '../../src/lib/stream-events';
import type { StreamTransport } from '../../src/lib/transport';

class CaptureTransport implements StreamTransport {
  readonly events: StreamEvent[] = [];

  async send(events: StreamEvent[]): Promise<void> {
    this.events.push(...events);
  }

  async close(): Promise<void> {}
}

describe('stream plugin', () => {
  let onMessage: ((value: Envelope) => void) | undefined;
  let transport: CaptureTransport;

  beforeEach(() => {
    transport = new CaptureTransport();
    onMessage = undefined;

    streamPlugin.coordinator({
      operation: 'runCucumber',
      options: {
        sessionId: 'sess-1',
        transport,
      },
      on: (_key, handler) => {
        onMessage = handler;
      },
    });
  });

  it('emits feature snapshot first and monotonically increasing seq', async () => {
    onMessage?.({ source: { data: 'Feature: Login\n  Scenario: ok\n    Given I log in', uri: 'features/login.feature' } } as Envelope);
    onMessage?.({ testRunFinished: { success: true } } as Envelope);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(transport.events[0].type).toBe('feature_snapshot');
    expect(transport.events[0].seq).toBe(1);
    expect(transport.events[1].type).toBe('run_finished');
    expect(transport.events[1].seq).toBe(2);
  });

  it('emits started/step/attachment/finished flow', async () => {
    onMessage?.({ source: { data: 'Feature: Login\n  Scenario: ok\n    Given I log in', uri: 'features/login.feature' } } as Envelope);

    onMessage?.({
      gherkinDocument: {
        uri: 'features/login.feature',
        feature: {
          name: 'Login',
          children: [
            {
              scenario: {
                id: 'ast-s1',
                steps: [{ id: 'ast-st1', keyword: 'Given ', text: 'I log in' }],
              },
            },
          ],
        },
      },
    } as Envelope);

    onMessage?.({
      pickle: {
        id: 'pickle-1',
        uri: 'features/login.feature',
        name: 'ok',
        astNodeIds: ['ast-s1'],
        steps: [{ text: 'I log in', astNodeIds: ['ast-st1'] }],
      },
    } as Envelope);

    onMessage?.({
      testCase: {
        id: 'tc-1',
        pickleId: 'pickle-1',
        testSteps: [{ id: 'ts-1', pickleStepId: 'ps-1' }],
      },
    } as Envelope);

    onMessage?.({ testCaseStarted: { id: 'tcs-1', testCaseId: 'tc-1' } } as Envelope);

    onMessage?.({
      testStepFinished: {
        testCaseStartedId: 'tcs-1',
        testCaseId: 'tc-1',
        testStepId: 'ts-1',
        testStepResult: { status: 1, message: '' },
      },
    } as Envelope);

    onMessage?.({
      attachment: {
        testCaseStartedId: 'tcs-1',
        testStepId: 'ts-1',
        mediaType: 'text/plain',
        contentEncoding: 0,
        body: 'hello',
      },
    } as Envelope);

    onMessage?.({ testCaseFinished: { testCaseStartedId: 'tcs-1', willBeRetried: false } } as Envelope);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(transport.events.map((e) => e.type)).toEqual([
      'feature_snapshot',
      'test_started',
      'step_finished',
      'attachment',
      'test_finished',
    ]);

    const seq = transport.events.map((e) => e.seq);
    expect(seq).toEqual([...seq].sort((a, b) => a - b));
  });
});
