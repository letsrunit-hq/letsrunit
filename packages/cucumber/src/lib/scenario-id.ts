import { normalizeSteps } from '@letsrunit/gherkin';
import { computeScenarioId, computeStepId } from '@letsrunit/store';

type ScenarioStep = {
  keyword: string;
  text?: string;
  argument?: {
    docString?: { content: string };
    dataTable?: { rows: ReadonlyArray<{ cells: ReadonlyArray<{ value: string }> }> };
  };
};

export function toScenarioId(testSteps: ScenarioStep[]): string | null {
  const scenarioSteps = testSteps.filter((step) => step.text !== undefined);
  if (scenarioSteps.length === 0) return null;

  const normalized = normalizeSteps(
    scenarioSteps.map((step) => ({
      keyword: step.keyword,
      text: step.text ?? '',
      docString: step.argument?.docString,
      dataTable: step.argument?.dataTable,
    })),
  );

  return computeScenarioId(normalized.map((text) => computeStepId(text)));
}
