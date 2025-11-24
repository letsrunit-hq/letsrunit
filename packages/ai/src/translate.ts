import ISO6391 from 'iso-639-1';
import { hash } from '@letsrunit/utils';
import { generate } from './generate';
import type { Cache } from 'cache-manager';

const PROMPT_TEXT = `Translate the text from English to {lang}.`;
const PROMPT_JSON = `Translate all text values within the provided JSON string from English to {lang}. Keep the JSON structure identical, translating only object values (never keys), array elements, or string contents. Do not alter numbers, booleans, nulls, or formatting. Return valid JSON.`;

interface TranslateOptions {
  cache?: Cache;
  prompt?: string;
  reasoningEffort?: 'minimal' | 'low' | 'medium';
}

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue | undefined };

const dummyCache = { wrap: async <T>(_: unknown, fn: () => Promise<T>) => await fn() };

function normalizeLang(locale: string): string {
  return locale.replace(/_.+/, '');
}

export async function translate<T extends JSONValue = JSONValue>(
  input: T,
  lang: string,
  options: TranslateOptions = {},
): Promise<T> {
  lang = normalizeLang(lang);

  if (lang === 'en') {
    return input;
  }

  const isString = typeof input === 'string';
  const str = isString ? input : JSON.stringify(input, null, 2);

  const cache = options.cache ?? dummyCache;
  const cacheKey = hash(str) + `:en:${lang}`;

  return cache.wrap(cacheKey, async () => {
    const prompt = (options.prompt ?? (isString ? PROMPT_TEXT : PROMPT_JSON)).replaceAll(
      '{lang}',
      ISO6391.getName(lang) || lang,
    );

    const translated = await generate(prompt, str, { model: 'small', reasoningEffort: options.reasoningEffort });

    return isString ? translated : JSON.parse(translated);
  });
}
