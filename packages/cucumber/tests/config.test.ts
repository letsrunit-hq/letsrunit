import { describe, expect, it } from 'vitest';
import { isAgentEnvironment, readCliWorldParameters, resolveDebugWorldParameters } from '../src/config';

describe('readCliWorldParameters', () => {
  it('reads inline --world-parameters=JSON', () => {
    const result = readCliWorldParameters(['cucumber-js', '--world-parameters={"headless":false}']);
    expect(result).toEqual({ headless: false });
  });

  it('reads separate --world-parameters JSON', () => {
    const result = readCliWorldParameters(['cucumber-js', '--world-parameters', '{"headless":false}']);
    expect(result).toEqual({ headless: false });
  });

  it('returns empty object for invalid JSON', () => {
    const result = readCliWorldParameters(['cucumber-js', '--world-parameters', '{not-json}']);
    expect(result).toEqual({});
  });
});

describe('resolveDebugWorldParameters', () => {
  it('derives failFast/headless and skipCloseOnFailure from argv', () => {
    const result = resolveDebugWorldParameters({
      argv: ['cucumber-js', '--fail-fast', '--world-parameters', '{"headless":false}'],
      baseWorldParameters: { baseURL: 'http://localhost:3000' },
    });

    expect(result.failFast).toBe(true);
    expect(result.headless).toBe(false);
    expect(result.worldParameters).toEqual({
      baseURL: 'http://localhost:3000',
      headless: false,
      skipCloseOnFailure: true,
    });
  });

  it('defaults to headless when no parameter is provided', () => {
    const result = resolveDebugWorldParameters({
      argv: ['cucumber-js'],
      baseWorldParameters: { baseURL: 'http://localhost:3000' },
    });

    expect(result.failFast).toBe(false);
    expect(result.headless).toBe(true);
    expect(result.worldParameters).toEqual({
      baseURL: 'http://localhost:3000',
      headless: true,
      skipCloseOnFailure: false,
    });
  });
});

describe('isAgentEnvironment', () => {
  it('returns false when no agent env vars are present', () => {
    expect(isAgentEnvironment({})).toBe(false);
  });

  it('returns true for known agent env vars', () => {
    expect(isAgentEnvironment({ CODEX_CI: '1' })).toBe(true);
    expect(isAgentEnvironment({ CLAUDECODE: '1' })).toBe(true);
    expect(isAgentEnvironment({ GEMINI_CLI: '1' })).toBe(true);
    expect(isAgentEnvironment({ CURSOR_AGENT: '1' })).toBe(true);
  });

  it('accepts extra env var keys', () => {
    expect(isAgentEnvironment({ FOO_AGENT: '1' }, ['FOO_AGENT'])).toBe(true);
  });

  it('treats falsey values as disabled', () => {
    expect(isAgentEnvironment({ CODEX_CI: '' })).toBe(false);
    expect(isAgentEnvironment({ CODEX_CI: '0' })).toBe(false);
    expect(isAgentEnvironment({ CODEX_CI: 'false' })).toBe(false);
  });
});
