import { describe, expect, it } from 'vitest';
import { scenarioIdFromGherkin } from '../src/scenario-id';

describe('scenarioIdFromGherkin', () => {
  it('returns the same id for equivalent step-only and scenario forms', () => {
    const id1 = scenarioIdFromGherkin('Given I am on "/"');
    const id2 = scenarioIdFromGherkin('Scenario:\n  Given I am on "/"');
    expect(id1).toBe(id2);
  });

  it('returns a sha256 hex id', () => {
    expect(scenarioIdFromGherkin('Given I am on "/"')).toMatch(/^[0-9a-f]{64}$/);
  });
});
