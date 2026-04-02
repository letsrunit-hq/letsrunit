import { describe, expect, it } from 'vitest';
import {
  computeExampleRowId,
  computeFeatureId,
  computeOutlineId,
  computeRuleId,
  computeScenarioId,
  computeStepId,
} from '../src';

describe('computeStepId', () => {
  it('returns the same ID for the same text', () => {
    expect(computeStepId('Given I am on the homepage')).toBe(computeStepId('Given I am on the homepage'));
  });

  it('returns different IDs for different text', () => {
    expect(computeStepId('Given I am on the homepage')).not.toBe(computeStepId('When I click the button'));
  });

  it('returns a 64-char hex hash', () => {
    const id = computeStepId('Given I do something');
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('computeScenarioId', () => {
  const s1 = computeStepId('Given one');
  const s2 = computeStepId('When two');
  const s3 = computeStepId('Then three');

  it('returns the same ID for the same step IDs', () => {
    const steps = [s1, s2, s3];
    expect(computeScenarioId(steps)).toBe(computeScenarioId(steps));
  });

  it('returns different IDs when step order changes', () => {
    expect(computeScenarioId([s1, s2])).not.toBe(computeScenarioId([s2, s1]));
  });

  it('returns different IDs for different step sets', () => {
    expect(computeScenarioId([s1, s2])).not.toBe(computeScenarioId([s1, s3]));
  });

  it('handles a single step', () => {
    const id = computeScenarioId([s1]);
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('computeFeatureId', () => {
  const a = computeScenarioId([computeStepId('Given a')]);
  const b = computeScenarioId([computeStepId('Given b')]);

  it('returns the same ID for the same scenario IDs', () => {
    expect(computeFeatureId([a, b])).toBe(computeFeatureId([a, b]));
  });

  it('returns different IDs for different scenario IDs', () => {
    expect(computeFeatureId([a, b])).not.toBe(computeFeatureId([a]));
  });

  it('is order-sensitive', () => {
    expect(computeFeatureId([a, b])).not.toBe(computeFeatureId([b, a]));
  });
});

describe('rule/outline/example IDs', () => {
  const s1 = computeScenarioId([computeStepId('Given one')]);
  const s2 = computeScenarioId([computeStepId('Given two')]);
  const st1 = computeStepId('Given user "<name>" exists');
  const st2 = computeStepId('When I login as "<name>"');

  it('computes deterministic rule IDs', () => {
    expect(computeRuleId([s1, s2])).toBe(computeRuleId([s1, s2]));
  });

  it('computes different rule IDs for different scenario sets', () => {
    expect(computeRuleId([s1, s2])).not.toBe(computeRuleId([s1]));
  });

  it('computes deterministic outline IDs', () => {
    expect(computeOutlineId([st1, st2])).toBe(computeOutlineId([st1, st2]));
  });

  it('computes deterministic example row IDs', () => {
    expect(computeExampleRowId(['visa', 'success'])).toBe(computeExampleRowId(['visa', 'success']));
  });

  it('computes different example row IDs for different values', () => {
    expect(computeExampleRowId(['visa', 'success'])).not.toBe(computeExampleRowId(['mastercard', 'success']));
  });
});
