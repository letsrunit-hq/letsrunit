import { describe, expect, it } from 'vitest';
import { computeStepId, computeScenarioId, computeFeatureId } from '../src/ids';

describe('computeStepId', () => {
  it('returns the same ID for the same text', () => {
    expect(computeStepId('Given I am on the homepage')).toBe(computeStepId('Given I am on the homepage'));
  });

  it('returns different IDs for different text', () => {
    expect(computeStepId('Given I am on the homepage')).not.toBe(computeStepId('When I click the button'));
  });

  it('returns a valid UUID string', () => {
    const id = computeStepId('Given I do something');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('computeScenarioId', () => {
  it('returns the same ID for the same step IDs', () => {
    const steps = ['id-a', 'id-b', 'id-c'];
    expect(computeScenarioId(steps)).toBe(computeScenarioId(steps));
  });

  it('returns different IDs when step order changes', () => {
    expect(computeScenarioId(['id-a', 'id-b'])).not.toBe(computeScenarioId(['id-b', 'id-a']));
  });

  it('returns different IDs for different step sets', () => {
    expect(computeScenarioId(['id-a', 'id-b'])).not.toBe(computeScenarioId(['id-a', 'id-c']));
  });

  it('handles a single step', () => {
    const id = computeScenarioId(['id-a']);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('computeFeatureId', () => {
  it('returns the same ID for the same URI', () => {
    expect(computeFeatureId('features/checkout.feature')).toBe(computeFeatureId('features/checkout.feature'));
  });

  it('returns different IDs for different URIs', () => {
    expect(computeFeatureId('features/checkout.feature')).not.toBe(computeFeatureId('features/login.feature'));
  });
});
