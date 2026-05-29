import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';

type LanguageModelV2 = Exclude<LanguageModel, string>;

export type ModelTier = 'large' | 'medium' | 'small';
export type AiProvider = 'openai' | 'anthropic' | 'google';

const DEFAULT_MODELS: Record<AiProvider, Record<ModelTier, string>> = {
  openai: {
    large: 'gpt-5.5',
    medium: 'gpt-5.4-mini',
    small: 'gpt-5.4-nano',
  },
  anthropic: {
    large: 'claude-opus-4-6',
    medium: 'claude-sonnet-4-6',
    small: 'claude-haiku-4-5-20251001',
  },
  google: {
    large: 'gemini-3-pro-preview',
    medium: 'gemini-3-flash-preview',
    small: 'gemini-2.5-flash-lite',
  },
};

export interface ResolvedModel {
  model: LanguageModelV2;
  provider: AiProvider;
  modelId: string;
}

function isAiProvider(value: string | undefined): value is AiProvider {
  return value === 'openai' || value === 'anthropic' || value === 'google';
}

function modelEnvName(type: ModelTier): string {
  return `LETSRUNIT_MODEL_${type.toUpperCase()}`;
}

export function getAiProvider(env: NodeJS.ProcessEnv = process.env): AiProvider {
  return isAiProvider(env.LETSRUNIT_AI_PROVIDER) ? env.LETSRUNIT_AI_PROVIDER : 'openai';
}

export function getModelId(type: ModelTier = 'medium', env: NodeJS.ProcessEnv = process.env): string {
  const provider = getAiProvider(env);
  return env[modelEnvName(type)] || DEFAULT_MODELS[provider][type];
}

export function resolveModel(type: ModelTier = 'medium', env: NodeJS.ProcessEnv = process.env): ResolvedModel {
  const provider = getAiProvider(env);
  const modelId = env[modelEnvName(type)] || DEFAULT_MODELS[provider][type];

  switch (provider) {
    case 'openai':
      return { model: openai(modelId), provider, modelId };
    case 'anthropic':
      return { model: anthropic(modelId), provider, modelId };
    case 'google':
      return { model: google(modelId), provider, modelId };
  }
}

export function getModel(type: ModelTier = 'medium'): LanguageModelV2 {
  return resolveModel(type).model;
}

export function defaultModelId(provider: AiProvider, type: ModelTier): string {
  return DEFAULT_MODELS[provider][type];
}

export function providerModelIds(provider: AiProvider): Record<ModelTier, string> {
  return { ...DEFAULT_MODELS[provider] };
}
