import { Controller } from '@letsrunit/controller';
import { type Feature } from '@letsrunit/gherkin';
import { Journal } from '@letsrunit/journal';
import { type RequiredAndOptional, splitUrl } from '@letsrunit/utils';
import { generateFeature } from './ai/generate-feature';
import type { Result } from './types';

interface GenerateOptions {
  headless?: boolean;
  journal?: Journal;
  accounts?: Record<string, string>;
  timeout?: number;
}

type GenerateInput = RequiredAndOptional<Feature, 'name' | 'description', 'comments'>;

export default async function generate(
  target: string,
  suggestion: GenerateInput,
  opts: GenerateOptions = {},
): Promise<Result> {
  const { base, path } = splitUrl(target);

  const steps: string[] = [
    path === '/' ? "Given I'm on the homepage" : `Given I'm on page "${path}"`,
    'And all popups are closed',
  ];

  const journal = opts.journal ?? Journal.nil();
  const controller = await Controller.launch({ headless: opts.headless, baseURL: base, journal });
  const signal = opts.timeout ? AbortSignal.timeout(opts.timeout) : undefined;

  try {
    return await generateFeature({
      controller,
      feature: {
        ...suggestion,
        background: steps,
        steps: [],
      },
      accounts: opts.accounts,
      signal,
    });
  } catch (e) {
    await journal.error('An unexpected error occurred');
    console.error(e);
    return { status: 'error' };
  } finally {
    await controller.close();
  }
}
