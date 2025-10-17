import ISO6391 from 'iso-639-1';
import type { JSONValue, Cache } from '../types';
import { hash } from '../utils/hash';
import { cached, dummyCache } from '../cache';
import { generate } from "./generate";

const PROMPT_TEXT = `Translate the text from English to {lang}.`
const PROMPT_JSON = `Translate all text values within the provided JSON string from English to {lang}. Keep the JSON structure identical, translating only object values (never keys), array elements, or string contents. Do not alter numbers, booleans, nulls, or formatting. Return valid JSON.`

interface TranslateOptions<T> {
  cache?: Cache<T>;
  prompt?: string;
}

function normalizeLang(locale: string): string {
  return locale.replace(/_.+/, '');
}

export async function translate<T extends JSONValue>(
  input: T,
  lang: string,
  options: TranslateOptions<T> = {}
): Promise<T> {
  lang = normalizeLang(lang);

  if (lang === 'en') {
    return input;
  }

  const isString = typeof input === 'string';
  const str = isString ? input : JSON.stringify(input, null, 2);

  const cache = options.cache ?? dummyCache;
  const cacheKey = hash(str) + `:en:${lang}`;

  return cached<T>(cache, cacheKey, async () => {
    const prompt = options.prompt ??
      (isString ? PROMPT_TEXT : PROMPT_JSON).replace('{lang}', ISO6391.getName(lang) || lang);

    const translated = await generate(prompt, str, { model: 'small' });

    return isString ? translated : JSON.parse(translated);
  });
}
