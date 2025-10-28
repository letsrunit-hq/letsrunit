import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { generate, mockAi } from '../src/generate';
import * as z from 'zod';

const generateTextMock = vi.fn<any>();
const generateObjectMock = vi.fn<any>();
let restore: (() => void) | undefined;

beforeEach(() => {
  generateTextMock.mockReset();
  generateObjectMock.mockReset();

  restore = mockAi(generateTextMock as any, generateObjectMock as any);
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

  it('passes schema to generateObject and returns parsed object', async () => {
    const schema = z.object({ a: z.string(), n: z.number().int() });
    const expected = { a: 'ok', n: 42 };
    generateObjectMock.mockResolvedValue({ object: expected });

    const result = await generate('sys', 'prompt', { schema });

    expect(generateObjectMock).toHaveBeenCalledWith({
      model: expect.anything(),
      system: 'sys',
      prompt: 'prompt',
      schema,
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });

    expect(result).toEqual(expected);
  });

  it('renders system template with vars and calls generateText', async () => {
    generateTextMock.mockResolvedValue({ text: 'done' });

    const system = { template: 'Hello {{name}} from {{place}}', vars: { name: 'Alice', place: 'Wonderland' } };
    const result = await generate(system, 'go');

    expect(generateTextMock).toHaveBeenCalledWith({
      model: expect.anything(),
      system: 'Hello Alice from Wonderland',
      prompt: 'go',
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });

    expect(result).toBe('done');
  });
});
