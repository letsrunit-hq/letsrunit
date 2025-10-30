import { generateMessages } from '@cucumber/gherkin';
import { IdGenerator, SourceMediaType } from '@cucumber/messages';

const newId = IdGenerator.uuid();

export interface Feature {
  name: string;
  description?: string;
  background?: string[];
  steps: string[];
}

export function writeFeature({ name, description, background, steps }: Feature): string {
  const lines = [
    `Feature: ${name}`.trim(),
    '',
  ];

  if (description) {
    lines.push(
      ...description.split('\n').map((s) => `  ${s.trim()}`),
      '',
    );
  }

  if (background && background.length > 0) {
    lines.push(
      '  Background:',
      ...background.map((s) => `    ${s}`),
      '',
    );
  }

  lines.push(
    '  Scenario:',
    ...steps.map((s) => `    ${s}`),
  );

  return lines.join('\n');
}

// Wrap steps in a minimal feature/scenario so the parser accepts it
function wrapIfNeeded(input: string): string {
  if (/^\s*Feature:/im.test(input)) return input;

  const lines = input.split('\n');
  const scenario = lines[0].trim().startsWith('Scenario:')
    ? lines.shift()!.trim()
    : 'Scenario:';

  const indented = lines.map((l) => (l.trim() ? '    ' + l : l));

  return [
    'Feature:',
    `  ${scenario}`,
    ...indented
  ].join('\n');
}

export function parseFeature(input: string): Feature {
  const source = wrapIfNeeded(input);

  const envelopes = generateMessages(
    source,
    'inline.feature',
    SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN,
    {
      newId: () => newId(),
      includeGherkinDocument: true,
      includePickles: false,
      includeSource: false,
    },
  );

  const gherkinDoc = envelopes.find((e) => e.gherkinDocument)?.gherkinDocument;
  const feature = gherkinDoc?.feature;
  if (!feature) return { name: '', description: '', steps: [] };

  // Find the first real Scenario (skip Rules/Backgrounds)
  const firstScenarioChild = feature.children?.find((c) => c.scenario && !c.scenario?.examples?.length);
  const scenario = firstScenarioChild?.scenario;
  if (!scenario) return { name: '', description: feature.description, steps: [] };

  const steps = (scenario.steps ?? []).map((s) => {
    const keyword = (s.keyword || '').trim();
    const text = s.text?.trim() || '';
    let result = `${keyword} ${text}`.trim();

    if (s.docString?.content) {
      result += `\n"""\n${s.docString.content.trim()}\n"""`;
    }

    if (s.dataTable?.rows?.length) {
      const table = s.dataTable.rows
        .map((r) => `| ${r.cells.map((c) => c.value.trim()).join(' | ')} |`)
        .join('\n');
      result += `\n${table}`;
    }

    return result;
  });

  return { name: feature.name, description: feature.description, steps };
}

export function deltaSteps(steps: string[], newSteps: string[]): string[] {
  let overlap = 0;

  for (let i = Math.min(steps.length, newSteps.length); i > 0; i--) {
    if (steps.slice(-i).join('\n') === newSteps.slice(0, i).join('\n')) {
      overlap = i;
      break;
    }
  }

  return newSteps.slice(overlap);
}
