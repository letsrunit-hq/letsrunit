import { Job, Result } from './types';
import { Controller } from '@letsrunit/controller';
import { describePage } from './explore/describe';
import { writeFeature } from './utils/feature';
import { observePage } from './explore/observe';
import { determineStory } from './explore/determine';
import { Journal, NoSkink } from '@letsrunit/journal';

interface RunTestOptions {
  headless?: boolean;
  journal?: Journal;
}

export default async function runTest(
  job: Job,
  opts: RunTestOptions = {},
): Promise<void> {
  // TODO split target in baseUrl and page.

  const steps: string[] = [
    'Given I\'m on page "/create"',
    'And all popups are closed',
    'When I check switch "Adres tonen"',
    "Then I'm done"
  ];

  const journal = opts.journal ?? new Journal(new NoSkink());
  const controller = await Controller.launch({ headless: opts.headless, baseURL: job.target });

  try {
    await controller.run(writeFeature({ name: "Explore", steps }));
  } finally {
    await controller.close();
  }
}
