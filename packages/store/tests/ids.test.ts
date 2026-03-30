import { describe, expect, it } from 'vitest';
import {
  computeStepId,
  computeScenarioId,
  computeFeatureId,
  computeRuleId,
  computeOutlineId,
  computeExampleRowId,
} from '../src/ids';

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
  it('computes deterministic rule IDs', () => {
    expect(computeRuleId('a.feature', 'Checkout', 0)).toBe(computeRuleId('a.feature', 'Checkout', 0));
  });

  it('computes deterministic outline IDs', () => {
    const rule = computeRuleId('a.feature', 'Checkout', 0);
    expect(computeOutlineId('a.feature', 'Pay with card', 1, rule)).toBe(
      computeOutlineId('a.feature', 'Pay with card', 1, rule),
    );
  });

  it('computes deterministic example row IDs', () => {
    const outline = computeOutlineId('a.feature', 'Pay with card', 1);
    expect(computeExampleRowId(outline, 0, ['visa', 'success'])).toBe(
      computeExampleRowId(outline, 0, ['visa', 'success']),
    );
  });
});
