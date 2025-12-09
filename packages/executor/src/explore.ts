import { Controller } from '@letsrunit/controller';
import { makeFeature } from '@letsrunit/gherkin';
import { Journal } from '@letsrunit/journal';
import { splitUrl } from '@letsrunit/utils';
import { extractPageInfo } from '../../playwright/src/page-info';
import { assessPage } from './ai/assess-page';
import { describePage } from './ai/describe-page';
import { generateFeature } from './ai/generate-feature';
import type { Action, AppInfo, Result } from './types';

interface ExploreOptions {
  headless?: boolean;
  journal?: Journal;
}

export type PreparedAction = Action & { path?: string; run: () => Promise<Result> };

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
  const controller = await Controller.launch({ headless: opts.headless, baseURL: base, journal, debug: true });

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
      `Reading page "${title}"`,
      () => describePage({ ...page, info: pageInfo }, 'markdown'),
      () => (pageInfo.screenshot ? { artifacts: [pageInfo.screenshot] } : {}),
    );

    await journal.debug(content);

    const { actions, ...appInfo } = await journal.do(
      'Determining user stories',
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
      path,
      run: () =>
        generateFeature({
          controller,
          feature: {
            ...action,
            comments: `Definition of done: ${action.done}`,
            background: steps,
            steps: [],
          },
          appInfo,
        }),
    }));

    const { base: appUrl } = splitUrl(pageInfo.url);
    await process({ ...pageInfo, ...appInfo, url: appUrl }, preparedActions);

    return { status: 'passed' };
  } catch (e) {
    await journal.error('An unexpected error occurred');
    console.error(e);
    return { status: 'error' };
  } finally {
    await controller.close();
  }
}
