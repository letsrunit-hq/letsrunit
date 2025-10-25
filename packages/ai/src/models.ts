import { openai } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';

type LanguageModelV2 = Exclude<LanguageModel, string>;

const modelGpt5 = openai('gpt-5');
const modelGpt5Mini = openai('gpt-5-mini');
const modelGpt5Nano = openai('gpt-5-nano');

export function getModel(type: 'large' | 'medium' | 'small' = 'medium'): LanguageModelV2 {
  switch (type) {
    case 'large':
      return modelGpt5;
    case 'medium':
      return modelGpt5Mini;
    case 'small':
      return modelGpt5Nano;
  }
}
