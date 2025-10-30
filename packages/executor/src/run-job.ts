import { Job, Result } from './types';
import { Controller } from '@letsrunit/controller';
import { describePage } from './explore/describe';
import { writeFeature } from './utils/feature';
import { observePage } from './explore/observe';
import { determineStory } from './explore/determine';
import { Journal, NoSkink } from '@letsrunit/journal';

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
  ];

  const journal = opts.journal ?? new Journal(new NoSkink());
  const controller = await Controller.launch({ headless: opts.headless, baseURL: job.target });

  try {
    const { page } = await controller.run(writeFeature({ name: "Explore", steps }));

    const content = await describePage(page, 'html');
    const { actions, ...appInfo } = await observePage(content);

    for (const action of actions) {
      const story = await determineStory({
        controller,
        page: { ...page, content },
        feature: {
          name: action,
          background: steps,
          steps: [],
        },
        appInfo,
      });

      console.log(story);
    }

    return { status: 'success' };
  } finally {
    await controller.close();
  }
}
