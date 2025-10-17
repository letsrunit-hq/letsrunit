import { Job, JSONValue, Result } from '@letsrunit/core/types';
import { launch, browse, suppressInterferences, describePage, snapshot, extractLang } from '@letsrunit/controller';
import { Cache } from '@letsrunit/core/types';
import { translate } from '@letsrunit/core/ai';

interface RunJobOptions {
  artifactSink?: (name: string, data: Buffer) => Promise<void>,
  cache?: Cache | ((type: string) => Cache);
}

const defaultCache: Cache = new Map();

function trFn(lang: string, opts: RunJobOptions) {
  const cache = (typeof opts.cache === 'function' ? opts.cache('translations') : opts.cache) ?? defaultCache;
  return <T extends JSONValue>(input: T, prompt?: string): Promise<T> => translate<T>(input, lang, { cache, prompt });
}

export default async function runJob(
  job: Job,
  opts: RunJobOptions = {},
): Promise<Result> {
  const browser = await launch();

  try {
    const page = await browse(browser, job.target);

    const lang = await extractLang(page);
    const tr = trFn(lang || 'en', opts);

    try {
      await suppressInterferences(page, { translate: tr });
    } catch (e) {
      console.error(e);
    }

    const staticPage = await snapshot(page, { title: true });

    const pageContent = await describePage(staticPage);
    console.log(pageContent);

  } catch (error) {
    console.error(error);
    return { status: 'error' };
  } finally {
    await browser.close();
  }

  return { status: 'success' };
}
