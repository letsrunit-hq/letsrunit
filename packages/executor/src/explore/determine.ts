import { Controller, Snapshot } from '@letsrunit/controller';
import { writeFeature } from '../utils/feature';

const PROMPT = `You're a QA tester, tasked with writing BDD tests in gherkin.


`

interface DetermineStoryOptions {
  controller: Controller;
  page: Snapshot & { content?: string };
  action: string;
  appInfo?: {
    purpose: string;
    loginAvailable: boolean;
  }
}

export async function determineStory({ controller, page, action, appInfo }: DetermineStoryOptions) {
  const steps: string[] = [
    "Given I'm on the homepage",
    "And all popups are closed"
  ];

  const feature = writeFeature(action, steps);
}
