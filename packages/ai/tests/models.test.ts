import { describe, expect, it } from 'vitest';
import { getModel } from '../src/models';

describe('getModel', () => {
  it('returns the large model instance', () => {
    const model = getModel('large');
    expect(model.modelId).eq('gpt-5');
  });

  it('returns the medium model instance', () => {
    const model = getModel('medium');
    expect(model.modelId).eq('gpt-5-mini');
  });

  it('returns the small model instance', () => {
    const model = getModel('small');
    expect(model.modelId).eq('gpt-5-nano');
  });

  it('returns the default (medium) model instance when no parameter is provided', () => {
    const model = getModel();
    expect(model.modelId).eq('gpt-5-mini');
  });
});
