import { executableScenarioIds } from '@letsrunit/gherkin';
import { unifiedHtmlDiff } from '@letsrunit/playwright';
import { findArtifacts, findLastRun, findLastTest, type LastRunTest, openStore } from '@letsrunit/store';
import { statusSymbol } from '@letsrunit/utils';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { explainFailure, type ExplainFailureResponse } from './ai/explain-failure';

export interface ExplainOptions {
  dbPath?: string;
  artifactsDir?: string;
}

export interface ExplainScenario {
  scenarioId: string;
  scenarioName: string;
  featurePath: string;
  steps: string;
  failureMessage: string;
  update: 'test' | 'code';
  updateMessage: string;
  reason: string;
  advice: string;
}

export interface ExplainScenarioError {
  scenarioId: string;
  scenarioName: string;
  featurePath: string;
  error: string;
}

export interface ExplainResult {
  hasRun: boolean;
  totalFailed: number;
  explanations: ExplainScenario[];
  errors: ExplainScenarioError[];
}

function defaultDbPath(): string {
  return join(process.cwd(), '.letsrunit', 'letsrunit.db');
}

function resolveArtifactsDir(dbPath: string, artifactsDir?: string): string {
  if (artifactsDir) return artifactsDir;
  return join(dirname(dbPath), 'artifacts');
}

function resolveFeaturePath(path: string): string {
  return isAbsolute(path) ? path : join(process.cwd(), path);
}

function isFailed(test: LastRunTest): boolean {
  return test.failedStepIndex !== null || test.status === 'failed';
}

function renderStepSymbol(index: number, failedStepIndex: number): string {
  if (index < failedStepIndex) return statusSymbol('success');
  if (index === failedStepIndex) return statusSymbol('failure');
  return statusSymbol();
}

function renderScenarioSteps(test: LastRunTest, failedStepIndex: number): string {
  return test.steps.map((step) => `${renderStepSymbol(step.index, failedStepIndex)} ${step.text}`).join('\n');
}

function pickLatestHtmlFilename(filenames: Array<{ filename: string }>): string | null {
  const html = filenames.filter((artifact) => artifact.filename.endsWith('.html'));
  if (html.length === 0) return null;
  return html.at(-1)?.filename ?? null;
}

function asHeading(update: ExplainFailureResponse['update']): string {
  return update === 'test' ? 'Test outdated' : 'Possible regression';
}

function buildPrompt(test: LastRunTest, renderedSteps: string, failureMessage: string, diff: string): string {
  return [
    `Feature: ${test.featureName}`,
    `Scenario: ${test.scenarioName}`,
    '',
    renderedSteps,
    '',
    'Failure message:',
    failureMessage,
    '',
    'HTML diff (baseline -> failed):',
    diff,
  ].join('\n');
}

function parseFeatureIds(featureCache: Map<string, Set<string>>, featurePath: string): Set<string> {
  const cached = featureCache.get(featurePath);
  if (cached) return cached;

  const source = readFileSync(resolveFeaturePath(featurePath), 'utf-8');
  const ids = executableScenarioIds(source, featurePath);
  featureCache.set(featurePath, ids);
  return ids;
}

function createError(test: LastRunTest, error: string): ExplainScenarioError {
  return {
    scenarioId: test.scenarioId,
    scenarioName: test.scenarioName,
    featurePath: test.featurePath,
    error,
  };
}

export default async function explain(options: ExplainOptions = {}): Promise<ExplainResult> {
  const dbPath = options.dbPath ?? defaultDbPath();
  const artifactsDir = resolveArtifactsDir(dbPath, options.artifactsDir);
  const db = openStore(dbPath);

  try {
    const run = findLastRun(db);
    if (!run) {
      return { hasRun: false, totalFailed: 0, explanations: [], errors: [] };
    }

    const featureCache = new Map<string, Set<string>>();
    const failedTests = run.tests.filter((test) => isFailed(test));
    const explanations: ExplainScenario[] = [];
    const errors: ExplainScenarioError[] = [];

    for (const test of failedTests) {
      try {
        if (test.failedStepIndex === null) {
          errors.push(createError(test, 'Missing failed step index for failed scenario'));
          continue;
        }

        const knownScenarioIds = parseFeatureIds(featureCache, test.featurePath);
        if (!knownScenarioIds.has(test.scenarioId)) {
          errors.push(createError(test, 'Scenario has changed in feature file since the last run'));
          continue;
        }

        const failedStep = test.steps.find((step) => step.index === test.failedStepIndex);
        if (!failedStep) {
          errors.push(createError(test, `Failed step at index ${test.failedStepIndex} was not found`));
          continue;
        }

        const baseline = findLastTest(db, test.scenarioId, 'passed');
        if (!baseline) {
          errors.push(createError(test, 'No prior successful baseline found for this scenario'));
          continue;
        }

        const failedArtifacts = findArtifacts(db, test.id, failedStep.id);
        const baselineArtifacts = findArtifacts(db, baseline.id, failedStep.id);

        const failedHtmlFile = pickLatestHtmlFilename(failedArtifacts);
        const baselineHtmlFile = pickLatestHtmlFilename(baselineArtifacts);

        if (!failedHtmlFile || !baselineHtmlFile) {
          errors.push(createError(test, 'Missing HTML snapshot artifact for failed step'));
          continue;
        }

        const failedHtml = readFileSync(join(artifactsDir, failedHtmlFile), 'utf-8');
        const baselineHtml = readFileSync(join(artifactsDir, baselineHtmlFile), 'utf-8');

        const diff = await unifiedHtmlDiff(
          { html: baselineHtml, url: 'about:blank' },
          { html: failedHtml, url: 'about:blank' },
        );

        const renderedSteps = renderScenarioSteps(test, test.failedStepIndex);
        const failureMessage = test.error ?? 'Step failed';
        const prompt = buildPrompt(test, renderedSteps, failureMessage, diff);
        const ai = await explainFailure(prompt);

        explanations.push({
          scenarioId: test.scenarioId,
          scenarioName: test.scenarioName,
          featurePath: test.featurePath,
          steps: renderedSteps,
          failureMessage,
          update: ai.update,
          updateMessage: asHeading(ai.update),
          reason: ai.reason,
          advice: ai.advice,
        });
      } catch (error) {
        errors.push(createError(test, (error as Error).message));
      }
    }

    return {
      hasRun: true,
      totalFailed: failedTests.length,
      explanations,
      errors,
    };
  } finally {
    db.close();
  }
}
