import * as ai from 'ai';
import { getModel } from './models';
import { wrapAISDK } from "langsmith/experimental/vercel";

const { generateText } = wrapAISDK(ai);

interface GenerateOptions {
  model?: 'large' | 'medium' | 'small';
}

export async function generate(system: string, prompt: string, opts: GenerateOptions = {}): Promise<string> {
  const model = getModel(opts.model);
  const result = await generateText({ model, system, prompt });

  return result.text;
}
