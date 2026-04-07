import { describe, expect, it } from 'vitest';
import { readCliWorldParameters, resolveDebugWorldParameters } from '../src/config';

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

