import type { Envelope } from '@cucumber/messages';
import {
  computeExampleRowId,
  computeOutlineId,
  computeScenarioId,
  computeStepId,
  normalizeSteps,
} from '@letsrunit/gherkin';

export type AstStep = { keyword: string };

export type ScenarioAstMeta = {
  ruleKey?: string;
  isOutline: boolean;
  outlineStepIds?: string[];
};

export type ExampleRowMeta = {
  values: string[];
  index: number;
};

export type FeatureAstMeta = {
  uri: string;
  name: string;
  scenarioByAstId: Map<string, ScenarioAstMeta>;
  exampleRowByAstId: Map<string, ExampleRowMeta>;
};

export type PickleEntry = {
  pickleId: string;
  uri: string;
  name: string;
  scenarioId: string;
  steps: { id: string; text: string }[];
  ruleKey?: string;
  outline?: string;
  exampleRow?: string;
  exampleIndex?: number;
};

export type TestCaseEntry = {
  scenarioId: string;
  stepIndexByTestStepId: Map<string, number>;
};

export type FailureInfo = {
  failedStepIndex: number;
  error: string | undefined;
};

interface GherkinScenarioNode {
  id: string;
  steps?: ReadonlyArray<{
    id: string;
    keyword: string;
    text: string;
    docString?: { content: string };
    dataTable?: { rows: ReadonlyArray<{ cells: ReadonlyArray<{ value: string }> }> };
  }>;
  examples?: ReadonlyArray<{
    tableBody?: ReadonlyArray<{ id: string; cells?: ReadonlyArray<{ value: string }> }>;
  }>;
}

export type ParsedPickle = {
  pickle: PickleEntry;
  bucketKey: string;
};

export function normalizeScenarioTemplateStepIds(scenario: GherkinScenarioNode): string[] {
  const normalized = normalizeSteps(
    (scenario.steps ?? []).map((step) => ({
      keyword: step.keyword,
      text: step.text,
      docString: step.docString,
      dataTable: step.dataTable,
    })),
  );
  return normalized.map((text) => computeStepId(text));
}

function normalizeRowValues(row?: { cells?: ReadonlyArray<{ value: string }> }): string[] {
  if (!row?.cells?.length) return [];
  return row.cells.map((cell) => cell.value.trim());
}

export function registerScenarioAst(
  scenario: GherkinScenarioNode,
  scenarioByAstId: Map<string, ScenarioAstMeta>,
  exampleRowByAstId: Map<string, ExampleRowMeta>,
  astStepMap: Map<string, AstStep>,
  ruleKey?: string,
): void {
  const isOutline = (scenario.examples?.length ?? 0) > 0;
  const outlineStepIds = isOutline ? normalizeScenarioTemplateStepIds(scenario) : undefined;

  scenarioByAstId.set(scenario.id, {
    ruleKey,
    isOutline,
    outlineStepIds,
  });

  for (const step of scenario.steps ?? []) {
    astStepMap.set(step.id, { keyword: step.keyword.trim() });
  }

  let rowIndex = 0;
  for (const examples of scenario.examples ?? []) {
    for (const row of examples.tableBody ?? []) {
      exampleRowByAstId.set(row.id, {
        values: normalizeRowValues(row),
        index: rowIndex++,
      });
    }
  }
}

export function extractFeatureAst(envelope: Envelope, astStepMap: Map<string, AstStep>): FeatureAstMeta | undefined {
  const doc = envelope.gherkinDocument;
  if (!doc?.feature) return undefined;

  const uri = doc.uri ?? '';
  const feature = doc.feature;
  const scenarioByAstId = new Map<string, ScenarioAstMeta>();
  const exampleRowByAstId = new Map<string, ExampleRowMeta>();
  let ruleIndex = 0;

  for (const child of feature.children ?? []) {
    if (child.background) {
      for (const step of child.background.steps ?? []) {
        astStepMap.set(step.id, { keyword: step.keyword.trim() });
      }
    }

    if (child.scenario) {
      registerScenarioAst(child.scenario, scenarioByAstId, exampleRowByAstId, astStepMap);
    }

    if (child.rule) {
      const currentRuleIndex = ruleIndex++;
      for (const ruleChild of child.rule.children ?? []) {
        if (ruleChild.background) {
          for (const step of ruleChild.background.steps ?? []) {
            astStepMap.set(step.id, { keyword: step.keyword.trim() });
          }
        }

        if (ruleChild.scenario) {
          registerScenarioAst(
            ruleChild.scenario,
            scenarioByAstId,
            exampleRowByAstId,
            astStepMap,
            `${uri}::${currentRuleIndex}`,
          );
        }
      }
    }
  }

  return {
    uri,
    name: feature.name ?? '',
    scenarioByAstId,
    exampleRowByAstId,
  };
}

export function parsePickle(
  envelope: Envelope,
  featureAstByUri: Map<string, FeatureAstMeta>,
  astStepMap: Map<string, AstStep>,
): ParsedPickle | undefined {
  const pickle = envelope.pickle;
  if (!pickle) return undefined;

  const featureMeta = featureAstByUri.get(pickle.uri);

  const normalizedPickleSteps = normalizeSteps(
    pickle.steps.map((pickleStep) => ({
      keyword: astStepMap.get(pickleStep.astNodeIds[0] ?? '')?.keyword ?? 'Given',
      text: pickleStep.text,
      docString: pickleStep.argument?.docString ? { content: pickleStep.argument.docString.content } : undefined,
      dataTable: pickleStep.argument?.dataTable,
    })),
  );

  const steps = normalizedPickleSteps.map((text) => ({ id: computeStepId(text), text }));
  const scenarioId = computeScenarioId(steps.map((s) => s.id));
  const scenarioAstId = pickle.astNodeIds.find((id) => featureMeta?.scenarioByAstId.has(id));
  const scenarioMeta = scenarioAstId ? featureMeta?.scenarioByAstId.get(scenarioAstId) : undefined;

  let outline: string | undefined;
  let exampleRow: string | undefined;
  let exampleIndex: number | undefined;

  if (scenarioMeta?.isOutline) {
    outline = computeOutlineId(scenarioMeta.outlineStepIds ?? []);
    const rowAstId = pickle.astNodeIds.find((id) => featureMeta?.exampleRowByAstId.has(id));
    const rowMeta = rowAstId ? featureMeta?.exampleRowByAstId.get(rowAstId) : undefined;

    if (rowMeta) {
      exampleIndex = rowMeta.index;
      exampleRow = computeExampleRowId(rowMeta.values);
    }
  }

  return {
    bucketKey: pickle.uri,
    pickle: {
      pickleId: pickle.id,
      uri: pickle.uri,
      name: pickle.name,
      scenarioId,
      steps,
      ruleKey: scenarioMeta?.ruleKey,
      outline,
      exampleRow,
      exampleIndex,
    },
  };
}

export function parseTestCase(envelope: Envelope, pickleMap: Map<string, PickleEntry>): TestCaseEntry | undefined {
  const testCase = envelope.testCase;
  if (!testCase) return undefined;

  const pickleEntry = pickleMap.get(testCase.pickleId);
  if (!pickleEntry) return undefined;

  const stepIndexByTestStepId = new Map<string, number>();
  let pickleStepIndex = 0;

  for (const testStep of testCase.testSteps) {
    if (testStep.pickleStepId !== undefined && testStep.pickleStepId !== '') {
      stepIndexByTestStepId.set(testStep.id, pickleStepIndex++);
    }
  }

  return { scenarioId: pickleEntry.scenarioId, stepIndexByTestStepId };
}
