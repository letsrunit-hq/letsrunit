import { beforeEach, describe, expect, it, vi } from 'vitest';

type OpenAIImplementation = (name: string) => unknown;

const openaiMock = vi.fn<OpenAIImplementation>();

vi.mock('@ai-sdk/openai', () => ({
  openai: openaiMock,
}));

describe('getModel', () => {
  const importModule = () => import('@letsrunit/core/ai/models');

  beforeEach(() => {
    vi.resetModules();
    openaiMock.mockReset();
    openaiMock.mockImplementation((name) => ({ id: name }));
  });

  it('initializes the available models using the OpenAI factory', async () => {
    await importModule();

    expect(openaiMock).toHaveBeenCalledTimes(3);
    expect(openaiMock.mock.calls).toEqual([
      ['gpt-5'],
      ['gpt-5-mini'],
      ['gpt-5-nano'],
    ]);
  });

  it('returns the correct model instance for every size and default parameter', async () => {
    const module = await importModule();
    const { getModel } = module;
    const [largeModel, mediumModel, smallModel] = openaiMock.mock.results.map((result) => result.value);

    expect(getModel('large')).toBe(largeModel);
    expect(getModel('medium')).toBe(mediumModel);
    expect(getModel('small')).toBe(smallModel);
    expect(getModel()).toBe(mediumModel);
  });
});
