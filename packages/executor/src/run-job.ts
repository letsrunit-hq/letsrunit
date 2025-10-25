import { Job, Result } from './types';
import { Controller } from '@letsrunit/controller';
import { describePage } from './explore/describe';
import { writeFeature } from './utils/feature';
import { observePage } from './explore/observe';
import { determineStory } from './explore/determine';
import { Journal, NoSkink } from '@letsrunit/journal';
import { sleep } from '@letsrunit/controller/src/utils/sleep';

interface RunJobOptions {
  headless?: boolean;
  journal?: Journal;
}

export default async function runJob(
  job: Job,
  opts: RunJobOptions = {},
): Promise<Result> {
  // TODO split target in baseUrl and page.

  const steps: string[] = [
    "Given I'm on the homepage",
    'And all popups are closed',
    'When I fill field "Zoek" with "lego"',
    'And I click the button "Zoeken"',
  ];

  const journal = opts.journal ?? new Journal(new NoSkink());
  const controller = await Controller.launch({ headless: opts.headless, baseURL: job.target });

  try {
    const page = await controller.run(writeFeature("Explore", steps));

    if (!opts.journal) {
      await sleep(10000);
      return { status: 'success' }; // Early exit for testing
    }

    const content = await describePage(page);
    const { actions, ...appInfo } = await observePage(content);

    for (const action of actions) {
      const story = await determineStory({
        controller,
        page: { ...page, content },
        feature: writeFeature(action, steps),
        appInfo,
      });

      console.log(story);
    }

    return { status: 'success' };
  } finally {
    await controller.close();
  }
}
