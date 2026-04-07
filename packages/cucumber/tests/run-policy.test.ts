import { describe, expect, it } from 'vitest';
import { resolveHeadless, shouldKeepBrowserOpenOnFailure } from '../src/run-policy';

describe('resolveHeadless', () => {
  it('defaults to true', () => {
    expect(resolveHeadless(undefined)).toBe(true);
  });

  it('uses boolean value from parameters', () => {
    expect(resolveHeadless({ headless: false })).toBe(false);
    expect(resolveHeadless({ headless: true })).toBe(true);
  });
});

describe('shouldKeepBrowserOpenOnFailure', () => {
  it('keeps browser open only for failed scenario in headed mode with skipCloseOnFailure=true', () => {
    const parameters = { headless: false, skipCloseOnFailure: true };
    expect(shouldKeepBrowserOpenOnFailure(parameters, 'FAILED')).toBe(true);
    expect(shouldKeepBrowserOpenOnFailure(parameters, 'PASSED')).toBe(false);
  });

  it('does not keep browser open when headless', () => {
    const parameters = { headless: true, skipCloseOnFailure: true };
    expect(shouldKeepBrowserOpenOnFailure(parameters, 'FAILED')).toBe(false);
  });
});

