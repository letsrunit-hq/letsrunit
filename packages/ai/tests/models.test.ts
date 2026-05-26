import { afterEach, describe, expect, it } from 'vitest';
import { defaultModelId, getAiProvider, getModel, getModelId, resolveModel } from '../src/models';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('getModel', () => {
  it('returns the large model instance', () => {
    const model = getModel('large');
    expect(model.modelId).eq('gpt-5.5');
  });

  it('returns the medium model instance', () => {
    const model = getModel('medium');
    expect(model.modelId).eq('gpt-5.4-mini');
  });

  it('returns the small model instance', () => {
    const model = getModel('small');
    expect(model.modelId).eq('gpt-5.4-nano');
  });

  it('returns the default (medium) model instance when no parameter is provided', () => {
    const model = getModel();
    expect(model.modelId).eq('gpt-5.4-mini');
  });

  it('resolves provider and model from environment', () => {
    process.env.LETSRUNIT_AI_PROVIDER = 'google';
    process.env.LETSRUNIT_MODEL_MEDIUM = 'gemini-custom';

    const resolved = resolveModel('medium');

    expect(getAiProvider()).toBe('google');
    expect(getModelId('medium')).toBe('gemini-custom');
    expect(resolved.provider).toBe('google');
    expect(resolved.modelId).toBe('gemini-custom');
  });

  it('falls back to provider defaults when model env vars are not set', () => {
    process.env.LETSRUNIT_AI_PROVIDER = 'anthropic';

    expect(getModelId('large')).toBe(defaultModelId('anthropic', 'large'));
  });
});
