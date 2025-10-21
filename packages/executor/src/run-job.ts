import { Job, Result } from './types';
import { run } from '@letsrunit/controller';

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
    "And all popups are closed"
  ];

  await run(steps.join("\n"), { headless: opts.headless, baseURL: job.target })

  return { status: 'error' }
}
