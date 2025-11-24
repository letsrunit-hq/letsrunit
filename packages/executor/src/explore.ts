import type { AppInfo, Result } from './types';
import { Controller } from '@letsrunit/controller';
import { describePage } from './ai/describe-page';
import { type Feature, makeFeature } from '@letsrunit/gherkin';
import { type Action, assessPage } from './ai/assess-page';
import { generateFeature } from './ai/generate-feature';
import { Journal } from '@letsrunit/journal';
import { splitUrl } from '@letsrunit/utils';
import { extractPageInfo } from './utils/page-info';

interface ExploreOptions {
  headless?: boolean;
  journal?: Journal;
}

export type PreparedAction = Action & { run: () => Promise<Feature> };

export default async function explore(
  target: string,
  opts: ExploreOptions = {},
  process: (info: AppInfo, actions: PreparedAction[]) => Promise<any>,
): Promise<Result> {
  const { base, path } = splitUrl(target);

  const steps: string[] = [
    path === '/' ? "Given I'm on the homepage" : `Given I'm on page "${path}"`,
    'And all popups are closed',
  ];

  const journal = opts.journal ?? Journal.nil();
  const controller = await Controller.launch({ headless: opts.headless, baseURL: base, journal });

  try {
    const { page } = await controller.run(makeFeature({ name: `Explore website "${base}"`, steps }));
    const pageInfo = await extractPageInfo(page);
    const title = pageInfo.title ?? pageInfo.url;

    await journal
      .batch()
      .prepare(`Reading page "${title}"`) // Step 3
      .prepare('Determining user stories') // Step 4
      .flush();

    const content = await journal.do(
      `> Reading page "${title}"`,
      () => describePage({ ...page, info: pageInfo }, 'markdown'),
      () => (pageInfo.screenshot ? { artifacts: [pageInfo.screenshot] } : {}),
    );

    await journal.debug(content);

    const { actions, ...appInfo } = await journal.do(
      '> Determining user stories',
      () => assessPage(content),
      (result) => ({
        meta: { result, description: `Found ${result.actions.length} user stories` },
      }),
    );

    await journal
      .batch()
      .debug(
        Object.entries(appInfo)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n'),
      )
      .each(actions, (j, action) =>
        j.debug(`- ${action.name}\n  ${action.description}\n  Definition of done: ${action.done}`),
      )
      .flush();

    const preparedActions = actions.map((action) => ({
      ...action,
      run: () =>
        generateFeature({
          controller,
          page: { ...page, lang: pageInfo.lang },
          feature: {
            ...action,
            comment: `Definition of done: ${action.done}`,
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
