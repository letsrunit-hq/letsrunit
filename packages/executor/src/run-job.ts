import { Job, JSONValue, Result } from '@letsrunit/core/types';
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
  const steps: string[] = [
    'Given'
  ];

  return { status: 'error' }
}
