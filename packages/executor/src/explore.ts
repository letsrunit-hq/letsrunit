import type { PageInfo, Result } from './types';
import { Controller } from '@letsrunit/controller';
import { describePage } from './ai/describe';
import { writeFeature } from '@letsrunit/gherkin';
import { type Assessment, type Action, assessPage } from './ai/assess';
import { determineStory } from './ai/determine';
import { Journal } from '@letsrunit/journal';
import { splitUrl } from './utils/split-url';
import { extractPageInfo } from './utils/page-info';

interface ExploreOptions {
  headless?: boolean;
  journal?: Journal;
}

type AppInfo = PageInfo & Omit<Assessment, 'actions'>;
type PreparedAction = Action & { run: () => Promise<void> };

export default async function explore(
  target: string,
  opts: ExploreOptions = {},
  process: (info: AppInfo, actions: PreparedAction[]) => Promise<void>,
): Promise<Result> {
  const { base, path } = splitUrl(target);

  const steps: string[] = [
    path === '/' ? "Given I'm on the homepage" : `Given I'm on page "${path}"`,
    'And all popups are closed',
  ];

  const journal = opts.journal ?? Journal.nil();
  const controller = await Controller.launch({ headless: opts.headless, baseURL: base, journal });

  try {
    const { page } = await controller.run(writeFeature({ name: "Explore website", steps }));
    const pageInfo = await extractPageInfo(page);

    const content = await journal.do(
      `Reading page "${pageInfo.title ?? pageInfo.url}"`,
      () => describePage({ ...page, info: pageInfo }, 'markdown'),
    );

    const { actions, ...appInfo } = await journal.do(
      'Determining user stories',
      () => assessPage(content),
    );

    const preparedActions = actions.map((action) => ({
      ...action,
      run: () => determineStory({
        controller,
        page,
        feature: {
          ...action,
          comment: action.done,
          background: steps,
          steps: [],
        },
        appInfo,
      }),
    }));

    await process({ ...pageInfo, ...appInfo }, preparedActions);

    return { status: 'success' };
  } catch (e) {
    await journal.error('An unexpected error occurred');
    console.error(e);
    return { status: 'error' };
  } finally {
    await controller.close();
  }
}
