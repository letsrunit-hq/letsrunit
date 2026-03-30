import { generateMessages } from '@cucumber/gherkin';
import { IdGenerator, SourceMediaType, type Envelope } from '@cucumber/messages';
import { computeScenarioId, computeStepId } from '@letsrunit/store';
import { normalizeSteps, type StepInput } from './normalize-steps';

const newId = IdGenerator.uuid();

interface AstStep {
  id: string;
  keyword: string;
}

interface GherkinDocumentWithFeature {
  feature?: {
    children?: ReadonlyArray<{
      background?: { steps?: ReadonlyArray<AstStep> };
      scenario?: { steps?: ReadonlyArray<AstStep> };
      rule?: {
        children?: ReadonlyArray<{
          background?: { steps?: ReadonlyArray<AstStep> };
          scenario?: { steps?: ReadonlyArray<AstStep> };
        }>;
      };
    }>;
  };
}

interface PickleEnvelope {
  pickle: {
    id: string;
    name: string;
    steps: ReadonlyArray<{
      astNodeIds: string[];
      text: string;
      argument?: {
        docString?: { content: string };
        dataTable?: { rows: ReadonlyArray<{ cells: ReadonlyArray<{ value: string }> }> };
      };
    }>;
  };
}

export interface ExecutableScenario {
  id: string;
  name: string;
}

function collectAstStepsFromDocument(doc: GherkinDocumentWithFeature | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!doc?.feature) return map;

  for (const child of doc.feature.children ?? []) {
    for (const step of child.background?.steps ?? []) {
      map.set(step.id, step.keyword.trim());
    }

    for (const step of child.scenario?.steps ?? []) {
      map.set(step.id, step.keyword.trim());
    }

    for (const ruleChild of child.rule?.children ?? []) {
      for (const step of ruleChild.background?.steps ?? []) {
        map.set(step.id, step.keyword.trim());
      }

      for (const step of ruleChild.scenario?.steps ?? []) {
        map.set(step.id, step.keyword.trim());
      }
    }
  }

  return map;
}

function toStepInputs(pickle: PickleEnvelope['pickle'], astKeywords: Map<string, string>): StepInput[] {
  return pickle.steps.map((step) => ({
    keyword: astKeywords.get(step.astNodeIds[0] ?? '') ?? 'Given',
    text: step.text,
    docString: step.argument?.docString ? { content: step.argument.docString.content } : undefined,
    dataTable: step.argument?.dataTable,
  }));
}

function parseEnvelopes(input: string, uri: string): Envelope[] {
  return generateMessages(input, uri, SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN, {
    newId: () => newId(),
    includeGherkinDocument: true,
    includePickles: true,
    includeSource: false,
  });
}

function asPickleEnvelope(envelope: Envelope): PickleEnvelope | null {
  if (!envelope.pickle) return null;
  return envelope as unknown as PickleEnvelope;
}

export function listExecutableScenarios(input: string, uri = 'inline.feature'): ExecutableScenario[] {
  const envelopes = parseEnvelopes(input, uri);
  const gherkinDocEnvelope = envelopes.find((e) => e.gherkinDocument);
  const astKeywords = collectAstStepsFromDocument(gherkinDocEnvelope?.gherkinDocument as GherkinDocumentWithFeature);

  const scenarios: ExecutableScenario[] = [];
  const seen = new Set<string>();

  for (const envelope of envelopes) {
    const pickleEnvelope = asPickleEnvelope(envelope);
    if (!pickleEnvelope) continue;

    const normalized = normalizeSteps(toStepInputs(pickleEnvelope.pickle, astKeywords));
    const stepIds = normalized.map((text) => computeStepId(text));
    const id = computeScenarioId(stepIds);

    if (seen.has(id)) continue;
    seen.add(id);

    scenarios.push({ id, name: pickleEnvelope.pickle.name });
  }

  return scenarios;
}

export function executableScenarioIds(input: string, uri = 'inline.feature'): Set<string> {
  return new Set(listExecutableScenarios(input, uri).map((s) => s.id));
}
