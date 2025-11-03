import type { Job, Result } from './types';
import { Controller } from '@letsrunit/controller';
import { describePage } from './explore/describe';
import { writeFeature } from '@letsrunit/gherkin';
import { observePage } from './explore/observe';
import { determineStory } from './explore/determine';
import { Journal } from '@letsrunit/journal';

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

  const journal = opts.journal ?? Journal.nil();
  const controller = await Controller.launch({ headless: opts.headless, baseURL: job.target, journal });

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
