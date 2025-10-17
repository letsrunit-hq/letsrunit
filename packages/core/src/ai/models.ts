import { openai } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';

const modelLarge = openai('gpt-5');
const modelMedium = openai('gpt-5-mini');
const modelSmall = openai('gpt-5-nano');

export function getModel(type: 'large' | 'medium' | 'small' = 'medium'): LanguageModel {
  switch (type) {
    case 'large':
      return modelLarge;
    case 'medium':
      return modelMedium;
    case 'small':
      return modelSmall;
  }
}
