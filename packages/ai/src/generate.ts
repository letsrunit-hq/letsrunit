import * as ai from 'ai';
import { getModel } from './models';
import { wrapAISDK } from "langsmith/experimental/vercel";

let generateText = wrapAISDK(ai).generateText;

export function mockGenerateText(gen: typeof generateText) {
  generateText = gen;

  return () => {
    generateText = wrapAISDK(ai).generateText;
  }
}

interface GenerateOptions {
  model?: 'large' | 'medium' | 'small';
  reasoningEffort?: 'minimal' | 'low' | 'medium';
}

export async function generate(system: string, prompt: string, opts: GenerateOptions = {}): Promise<string> {
  const model = getModel(opts.model);

  const result = await generateText({
    model,
    system,
    prompt,
    providerOptions: {
      openai: {
        reasoningEffort: opts.reasoningEffort ?? 'low'
      }
    },
  });

  return result.text;
}
