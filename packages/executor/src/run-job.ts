import { Job, Result } from './types';
import { run } from '@letsrunit/controller';
import { describePage } from './tools/describe-page';
import { feature } from './utils/feature';

interface RunJobOptions {
  headless?: boolean;
}

export default async function runJob(
  job: Job,
  opts: RunJobOptions = {},
): Promise<Result> {
  // TODO split target in baseUrl and page.

  const steps: string[] = [
    "Given I'm on the homepage"
  ];

  const page = await run(feature("Explore", steps), { headless: opts.headless, baseURL: job.target });
  const content = await describePage(page);

  console.log(content)

  return { status: 'error' }
}
