import * as ai from 'ai';
import { ModelMessage, ToolSet } from 'ai';
import { wrapAISDK } from 'langsmith/experimental/vercel';
import Mustache from 'mustache';
import * as z from 'zod';
import { getModel } from './models';

Mustache.escape = (text: string) => text;

let { generateText, generateObject } = wrapAISDK(ai);

export function mockAi(genText: typeof generateText, genObject?: typeof generateObject) {
  generateText = genText;
  if (genObject) generateObject = genObject;

  return () => {
    const wrapped = wrapAISDK(ai);
    generateText = wrapped.generateText;
    generateObject = wrapped.generateObject;
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
  if (opts.tools && opts.schema) {
    throw new Error("It's not possible to pass both a schema and tools");
  }

  if (typeof system === 'object') {
    system = Mustache.render(system.template, system.vars);
  }

  const arg = {
    model: getModel(opts.model),
    system,
    prompt,
    providerOptions: {
      openai: {
        reasoningEffort: opts.reasoningEffort ?? 'low',
      },
    },
    abortSignal: opts.abortSignal,
  };

  if (opts.schema) {
    const result = await generateObject({ ...arg, schema: opts.schema });
    return result.object as any;
  } else {
    const result = await generateText({ ...arg, tools: opts.tools });
    return result.text as any;
  }
}
