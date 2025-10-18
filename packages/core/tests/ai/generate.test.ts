import { beforeEach, describe, expect, it, vi } from 'vitest';

type AnyFn = (...args: any[]) => any;

const aiNamespaceMock = { __esModule: true, default: { name: 'ai-namespace' } } as Record<string, unknown>;
const generateTextMock = vi.fn<AnyFn>();
const wrapAISDKMock = vi.fn<AnyFn>();
const getModelMock = vi.fn<AnyFn>();

vi.mock('ai', () => aiNamespaceMock);
vi.mock('langsmith/experimental/vercel', () => ({
  wrapAISDK: wrapAISDKMock,
}));
vi.mock('../../src/ai/models', () => ({
  getModel: getModelMock,
}));

beforeEach(() => {
  vi.resetModules();
  generateTextMock.mockReset();
  wrapAISDKMock.mockReset();
  wrapAISDKMock.mockImplementation(() => ({ generateText: generateTextMock }));
  getModelMock.mockReset();
});

describe('generate', () => {
  const importModule = () => import('@letsrunit/core/ai/generate');

  it('uses the medium model by default', async () => {
    const mediumModel = Symbol('medium');
    getModelMock.mockReturnValue(mediumModel);
    generateTextMock.mockResolvedValue({ text: 'generated text' });

    const { generate } = await importModule();
    const result = await generate('system message', 'prompt text');

    expect(getModelMock).toHaveBeenCalledWith(undefined);
    expect(generateTextMock).toHaveBeenCalledWith({
      model: mediumModel,
      system: 'system message',
      prompt: 'prompt text',
    });
    expect(result).toBe('generated text');
  });

  it('allows overriding the selected model', async () => {
    const largeModel = Symbol('large');
    getModelMock.mockReturnValue(largeModel);
    generateTextMock.mockResolvedValue({ text: 'large model output' });

    const { generate } = await importModule();
    const result = await generate('system', 'prompt', { model: 'large' });

    expect(getModelMock).toHaveBeenCalledWith('large');
    expect(generateTextMock).toHaveBeenCalledWith({
      model: largeModel,
      system: 'system',
      prompt: 'prompt',
    });
    expect(result).toBe('large model output');
  });

  it('wraps the AI SDK using the langsmith adapter', async () => {
    getModelMock.mockReturnValue(Symbol('model'));
    generateTextMock.mockResolvedValue({ text: 'text' });

    await importModule();

    expect(wrapAISDKMock).toHaveBeenCalledTimes(1);
    expect(wrapAISDKMock).toHaveBeenCalledWith(aiNamespaceMock);
  });
});
