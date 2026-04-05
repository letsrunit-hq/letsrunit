import { normalizeStep } from './normalize-step';

export interface StepInput {
  keyword: string;
  text: string;
  docString?: { content: string };
  dataTable?: { rows: ReadonlyArray<{ cells: ReadonlyArray<{ value: string }> }> };
}

export function normalizeSteps(steps: ReadonlyArray<StepInput>, initialKeyword = 'Given'): string[] {
  let currentKeyword = initialKeyword;

  return steps.map((step) => {
    let keyword = step.keyword.trim();
    const lc = keyword.toLowerCase();

    if (lc === 'and' || lc === 'but' || keyword === '*') {
      keyword = currentKeyword;
    } else {
      currentKeyword = keyword;
    }

    return normalizeStep(keyword, step.text, step.docString, step.dataTable);
  });
}
