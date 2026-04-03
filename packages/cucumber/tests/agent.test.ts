import { describe, expect, it } from 'vitest';
import { buildStructuredFailure } from '../src/agent';

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
});
