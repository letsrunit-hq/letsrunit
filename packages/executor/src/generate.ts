import type { Result } from './types';
import { Controller } from '@letsrunit/controller';
import { type Feature, makeFeature } from '@letsrunit/gherkin';
import { generateFeature } from './ai/generate-feature';
import { Journal } from '@letsrunit/journal';
import { splitUrl } from '@letsrunit/utils';
import { extractPageInfo } from './utils/page-info';

interface GenerateOptions {
  headless?: boolean;
  journal?: Journal;
}

interface GenerateResult extends Result {
  feature?: Feature;
}

export default async function generate(
  target: string,
  suggestion: Pick<Feature, 'name' | 'description' | 'comments'>,
  opts: GenerateOptions = {},
): Promise<GenerateResult> {
  const { base, path } = splitUrl(target);

  const steps: string[] = [
    path === '/' ? "Given I'm on the homepage" : `Given I'm on page "${path}"`,
    'And all popups are closed',
  ];

  const journal = opts.journal ?? Journal.nil();
  const controller = await Controller.launch({ headless: opts.headless, baseURL: base, journal });

  try {
    const { page } = await controller.run(makeFeature({ ...suggestion, steps }));
    const pageInfo = await extractPageInfo(page);

    const feature = await generateFeature({
      controller,
      page: { ...page, lang: pageInfo.lang },
      feature: {
        ...suggestion,
        background: steps,
        steps: [],
      },
    });

    return { status: 'passed', feature };
  } catch (e) {
    await journal.error('An unexpected error occurred');
    console.error(e);
    return { status: 'error' };
  } finally {
    await controller.close();
  }
}
