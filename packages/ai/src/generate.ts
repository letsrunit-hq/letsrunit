import * as ai from 'ai';
import { ModelMessage, ToolSet } from 'ai';
import Mustache from 'mustache';
import * as z from 'zod';
import { resolveModel } from './models';

Mustache.escape = (text: string) => text;

const LANGSMITH_ENV_VARS = [
  'LANGSMITH_TRACING',
  'LANGSMITH_WORKSPACE_ID',
  'LANGSMITH_API_KEY',
  'LANGSMITH_ENDPOINT',
  'LANGSMITH_PROJECT',
] as const;

type GenerateText = typeof ai.generateText;
type GenerateObject = typeof ai.generateObject;

interface AISDK {
  generateText: GenerateText;
  generateObject: GenerateObject;
}

type LangSmithModule = typeof import('langsmith/experimental/vercel');

let aiSdkOverride: AISDK | undefined;
let aiSdkPromise: Promise<AISDK> | undefined;
let langSmithLoader = importLangSmithModule;

function defaultAISDK(): AISDK {
  return {
    generateText: ai.generateText,
    generateObject: ai.generateObject,
  };
}

function hasLangSmithConfiguration(): boolean {
  return LANGSMITH_ENV_VARS.some((name) => isConfigured(process.env[name]));
}

function isConfigured(value: string | undefined): boolean {
  if (!value) return false;
  return value !== '0' && value.toLowerCase() !== 'false';
}

async function loadAISDK(): Promise<AISDK> {
  if (aiSdkOverride) return aiSdkOverride;
  if (!hasLangSmithConfiguration()) return defaultAISDK();
  aiSdkPromise ??= loadLangSmithAISDK();
  return aiSdkPromise;
}

async function loadLangSmithAISDK(): Promise<AISDK> {
  try {
    const { wrapAISDK } = await langSmithLoader();
    return wrapAISDK(ai);
  } catch (error) {
    aiSdkPromise = undefined;
    throw new Error(
      'LangSmith tracing is configured, but `langsmith` is not installed. Install `langsmith@>=0.6.0` to enable tracing.',
      { cause: error },
    );
  }
}

async function importLangSmithModule(): Promise<LangSmithModule> {
  return import('langsmith/experimental/vercel');
}

export function mockAi(genText: GenerateText, genObject?: GenerateObject) {
  aiSdkOverride = {
    generateText: genText,
    generateObject: genObject ?? ai.generateObject,
  };

  return () => {
    aiSdkOverride = undefined;
    aiSdkPromise = undefined;
  };
}

export function mockLangSmith(loader: typeof langSmithLoader) {
  langSmithLoader = loader;
  aiSdkPromise = undefined;

  return () => {
    langSmithLoader = importLangSmithModule;
    aiSdkPromise = undefined;
  };
}

interface GenerateOptions<T extends z.Schema | undefined = undefined> {
  model?: 'large' | 'medium' | 'small';
  reasoningEffort?: 'minimal' | 'low' | 'medium';
  schema?: T;
  tools?: ToolSet;
  abortSignal?: AbortSignal;
}

export async function generate<T extends z.Schema | undefined = undefined>(
  system: string | { template: string; vars: { [key: string]: any } },
  prompt: string | ModelMessage[],
  opts: GenerateOptions<T> = {},
): Promise<T extends z.Schema ? z.infer<Exclude<T, undefined>> : string> {
  const { generateText, generateObject } = await loadAISDK();

  if (opts.tools && opts.schema) {
    throw new Error("It's not possible to pass both a schema and tools");
  }

  if (typeof system === 'object') {
    system = Mustache.render(system.template, system.vars).trim();
  }

  const resolved = resolveModel(opts.model);
  const arg = {
    model: resolved.model,
    system,
    prompt,
    ...(resolved.provider === 'openai'
      ? {
          providerOptions: {
            openai: {
              reasoningEffort: opts.reasoningEffort ?? 'low',
            },
          },
        }
      : {}),
    ...(opts.abortSignal ? { abortSignal: opts.abortSignal } : {}),
  };

  if (opts.schema) {
    const result = await generateObject({ ...arg, schema: opts.schema });
    return result.object as any;
  } else {
    const result = await generateText({ ...arg, tools: opts.tools });
    return result.text as any;
  }
}
