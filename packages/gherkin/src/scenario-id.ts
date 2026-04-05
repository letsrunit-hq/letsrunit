import { computeScenarioId, computeStepId } from '@letsrunit/store';
import { parseFeature } from './feature';

export function scenarioIdFromGherkin(input: string): string {
  const { steps } = parseFeature(input);
  const stepIds = steps.map((step) => computeStepId(step));
  return computeScenarioId(stepIds);
}
