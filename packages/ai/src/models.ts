import { openai } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';

type LanguageModelV2 = Exclude<LanguageModel, string>;

let modelLarge: LanguageModelV2 = openai('gpt-5');
let modelMedium: LanguageModelV2 = openai('gpt-5-mini');
let modelSmall: LanguageModelV2 = openai('gpt-5-nano');

export function getModel(type: 'large' | 'medium' | 'small' = 'medium'): LanguageModelV2 {
  switch (type) {
    case 'large':
      return modelLarge;
    case 'medium':
      return modelMedium;
    case 'small':
      return modelSmall;
  }
}
