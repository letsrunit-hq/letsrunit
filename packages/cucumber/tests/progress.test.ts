import { describe, expect, it } from 'vitest';
import { extractFailureDetails } from '../src/progress';

describe('extractFailureDetails', () => {
  it('prefers the deepest Playwright error over wrapper expect failure', () => {
    const message = [
      'Error: expect(locator).toBeVisible() failed',
      '',
      "Locator: locator('text=/Hi world/i').first()",
      'Expected: visible',
      'Timeout: 5000ms',
      'Error: element(s) not found',
      '',
      'Call log:',
      '  - Expect "to.be.visible" with timeout 5000ms',
      "  - waiting for locator('text=/Hi world/i').first()",
      '',
      '    at Proxy.<anonymous> (/path/expect.js:213:24)',
    ].join('\n');

    const details = extractFailureDetails(message);
    expect(details.error).toBe('element(s) not found');
    expect(details.locator).toBe('text=/Hi world/i');
    expect(details.url).toBeUndefined();
  });

  it('falls back to first useful line for non-Playwright message', () => {
    const details = extractFailureDetails('Something bad happened');
    expect(details.error).toBe('Something bad happened');
    expect(details.locator).toBeUndefined();
  });

  it('extracts URL when present', () => {
    const details = extractFailureDetails('Error: timed out\nURL: /\n');
    expect(details.error).toBe('timed out');
    expect(details.url).toBe('/');
  });
});
