import { Job, Result } from './types';
import { Controller } from '@letsrunit/controller';
import { describePage } from './tools/describe-page';
import { feature } from './utils/feature';
import { explorePage } from './explore/explore';

interface RunJobOptions {
  headless?: boolean;
}

export default async function runJob(
  job: Job,
  opts: RunJobOptions = {},
): Promise<Result> {
  // TODO split target in baseUrl and page.

  const steps: string[] = [
    "Given I'm on the homepage",
    "Given all popups are closed"
  ];

  const controller = await Controller.launch({ headless: opts.headless, baseURL: job.target });

  try {
    const page = await controller.run(feature("Explore", steps), );

    const content = await describePage(page);
    console.log(content);

    const purpose = await explorePage(content);

    console.log(purpose);

    return { status: 'success' };
  } finally {
    await controller.close();
  }
}
