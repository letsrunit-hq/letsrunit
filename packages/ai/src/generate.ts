import * as ai from 'ai';
import { getModel } from './models';
import { wrapAISDK } from "langsmith/experimental/vercel";
import * as z from 'zod';

let { generateText, generateObject } = wrapAISDK(ai);

export function mockAi(genText: typeof generateText, genObject: typeof generateObject) {
  generateText = genText;
  generateObject = genObject;

  return () => {
    const wrapped = wrapAISDK(ai);
    generateText = wrapped.generateText;
    generateObject = wrapped.generateObject;
  }
}

interface GenerateOptions<T extends z.Schema | undefined = undefined> {
  model?: 'large' | 'medium' | 'small';
  reasoningEffort?: 'minimal' | 'low' | 'medium';
  schema?: T;
}

export async function generate<T extends z.Schema | undefined = undefined>(
  system: string,
  prompt: string,
  opts: GenerateOptions<T> = {},
): Promise<T extends z.Schema ? z.infer<Exclude<T, undefined>> : string> {
  const arg = {
    model: getModel(opts.model),
    system,
    prompt,
    providerOptions: {
      openai: {
        reasoningEffort: opts.reasoningEffort ?? 'low'
      }
    },
  };

  if (opts.schema) {
    const result = await generateObject({ ...arg, schema: opts.schema });
    return result.object as any;
  } else {
    const result = await generateText(arg);
    return result.text as any;
  }
}
