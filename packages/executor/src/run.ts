import { Controller } from '@letsrunit/controller';
import { type Feature, makeFeature } from '@letsrunit/gherkin';
import { Journal } from '@letsrunit/journal';
import { splitUrl } from '@letsrunit/utils';
import type { Result } from './types';

interface GenerateOptions {
  headless?: boolean;
  journal?: Journal;
}

export default async function run(
  target: string,
  feature: Feature | string,
  opts: GenerateOptions = {},
): Promise<Result> {
  const { base } = splitUrl(target);

  const journal = opts.journal ?? Journal.nil();
  const controller = await Controller.launch({ headless: opts.headless, baseURL: base, journal });
  const featureText = typeof feature === 'string' ? feature : makeFeature(feature);

  try {
    const { status } = await controller.run(featureText);
    return { status };
  } catch (e) {
    await journal.error('An unexpected error occurred');
    console.error(e);
    return { status: 'error' };
  } finally {
    await controller.close();
  }
}
