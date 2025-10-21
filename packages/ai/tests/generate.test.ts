import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { generate, mockGenerateFunctions } from '../src/generate';

const generateTextMock = vi.fn<any>();
let restore: (() => void) | undefined;

beforeEach(() => {
  generateTextMock.mockReset();
  restore = mockGenerateFunctions(generateTextMock as any);
});

afterEach(() => {
  restore?.();
});

describe('generate', () => {
  it('uses the medium model by default', async () => {
    generateTextMock.mockResolvedValue({ text: 'generated text' });

    const result = await generate('system message', 'prompt text');

    expect(generateTextMock).toHaveBeenCalledWith({
      model: expect.anything(),
      system: 'system message',
      prompt: 'prompt text',
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });

    const passed = (generateTextMock.mock.calls[0][0] as any).model;
    expect(passed?.modelId).toBe('gpt-5-mini');
    expect(result).toBe('generated text');
  });

  it('allows overriding the selected model', async () => {
    generateTextMock.mockResolvedValue({ text: 'large model output' });

    const result = await generate('system', 'prompt', { model: 'large' });

    expect(generateTextMock).toHaveBeenCalledWith({
      model: expect.anything(),
      system: 'system',
      prompt: 'prompt',
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });
    const passed = (generateTextMock.mock.calls[0][0] as any).model;
    expect(passed?.modelId).toBe('gpt-5');
    expect(result).toBe('large model output');
  });
});
