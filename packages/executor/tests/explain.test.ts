import { generate } from '@letsrunit/ai';
import { executableScenarioIds } from '@letsrunit/gherkin';
import { unifiedHtmlDiff } from '@letsrunit/playwright';
import * as store from '@letsrunit/store';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import explain from '../src/explain';

vi.mock('@letsrunit/ai');
vi.mock('@letsrunit/gherkin');
vi.mock('@letsrunit/playwright');
vi.mock('@letsrunit/store');
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }));

function makeDb() {
  return { close: vi.fn() } as any;
}

describe('explain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(store.openStore).mockReturnValue(makeDb());
  });

  it('returns hasRun=false when no run exists', async () => {
    vi.mocked(store.findLastRun).mockReturnValue(null);

    const result = await explain({ dbPath: '/tmp/letsrunit.db', artifactsDir: '/tmp/artifacts' });

    expect(result).toEqual({
      hasRun: false,
      totalFailed: 0,
      explanations: [],
      errors: [],
    });
  });

  it('returns no explanations when latest run has no failures', async () => {
    vi.mocked(store.findLastRun).mockReturnValue({
      id: 'run-1',
      startedAt: 10,
      gitCommit: 'abc',
      tests: [
        {
          id: 'test-1',
          scenarioId: 's1',
          scenarioName: 'Scenario',
          featureId: 'f1',
          featurePath: 'features/a.feature',
          featureName: 'Feature A',
          status: 'passed',
          startedAt: 11,
          failedStepIndex: null,
          error: null,
          ruleId: null,
          outlineId: null,
          exampleRowId: null,
          exampleIndex: null,
          steps: [{ id: 'st1', index: 0, text: 'Given x' }],
        },
      ],
    } as any);

    const result = await explain();
    expect(result.hasRun).toBe(true);
    expect(result.totalFailed).toBe(0);
    expect(result.explanations).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('explains a failed scenario with diff + structured output', async () => {
    vi.mocked(store.findLastRun).mockReturnValue({
      id: 'run-1',
      startedAt: 10,
      gitCommit: 'abc',
      tests: [
        {
          id: 'test-failed',
          scenarioId: 'scenario-1',
          scenarioName: 'Checkout',
          featureId: 'f1',
          featurePath: 'features/checkout.feature',
          featureName: 'Checkout',
          status: 'failed',
          startedAt: 12,
          failedStepIndex: 1,
          error: 'button not found',
          ruleId: null,
          outlineId: null,
          exampleRowId: null,
          exampleIndex: null,
          steps: [
            { id: 'step-1', index: 0, text: 'Given I am on "/cart"' },
            { id: 'step-2', index: 1, text: 'When I click "Proceed to payment"' },
            { id: 'step-3', index: 2, text: 'Then I should be on "/payment"' },
          ],
        },
      ],
    } as any);

    vi.mocked(executableScenarioIds).mockReturnValue(new Set(['scenario-1']));
    vi.mocked(store.findLastTest).mockReturnValue({ id: 'test-pass', gitCommit: 'abc' });
    vi.mocked(store.findArtifacts)
      .mockReturnValueOnce([{ filename: 'failed.html', stepId: 'step-2', stepIdx: 1 }] as any)
      .mockReturnValueOnce([{ filename: 'base.html', stepId: 'step-2', stepIdx: 1 }] as any);

    vi.mocked(readFileSync)
      .mockReturnValueOnce('Feature: Checkout\nScenario: Checkout')
      .mockReturnValueOnce('<html>baseline</html>')
      .mockReturnValueOnce('<html>failed</html>');

    vi.mocked(unifiedHtmlDiff).mockResolvedValue('--- before\n+++ after');
    vi.mocked(generate).mockResolvedValue({
      update: 'code',
      reason: 'The checkout CTA disappeared from cart.',
      advice: 'Restore the CTA or update the checkout navigation.',
    } as any);

    const result = await explain({ dbPath: '/tmp/letsrunit.db', artifactsDir: '/tmp/artifacts' });

    expect(result.totalFailed).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(result.explanations).toHaveLength(1);
    expect(result.explanations[0].updateMessage).toContain('Possible regression');
    expect(result.explanations[0].reason).toBe('The checkout CTA disappeared from cart.');
    expect(result.explanations[0].steps).toContain('✔ Given I am on "/cart"');
    expect(result.explanations[0].steps).toContain('✖ When I click "Proceed to payment"');
    expect(result.explanations[0].steps).toContain('- Then I should be on "/payment"');
  });

  it('reports scenario-changed error and continues', async () => {
    vi.mocked(store.findLastRun).mockReturnValue({
      id: 'run-1',
      startedAt: 10,
      gitCommit: 'abc',
      tests: [
        {
          id: 'test-failed',
          scenarioId: 'scenario-1',
          scenarioName: 'Checkout',
          featureId: 'f1',
          featurePath: 'features/checkout.feature',
          featureName: 'Checkout',
          status: 'failed',
          startedAt: 12,
          failedStepIndex: 0,
          error: 'broken',
          ruleId: null,
          outlineId: null,
          exampleRowId: null,
          exampleIndex: null,
          steps: [{ id: 'step-1', index: 0, text: 'Given x' }],
        },
      ],
    } as any);

    vi.mocked(readFileSync).mockReturnValue('Feature: Checkout\nScenario: Changed');
    vi.mocked(executableScenarioIds).mockReturnValue(new Set(['other']));

    const result = await explain({ dbPath: '/tmp/letsrunit.db', artifactsDir: '/tmp/artifacts' });
    expect(result.explanations).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Scenario has changed');
  });
});
