import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { generate, mockAi, mockLangSmith } from '../src/generate';
import * as z from 'zod';

const generateTextMock = vi.fn<any>();
const generateObjectMock = vi.fn<any>();
let restore: (() => void) | undefined;
let restoreLangSmith: (() => void) | undefined;

beforeEach(() => {
  generateTextMock.mockReset();
  generateObjectMock.mockReset();
  delete process.env.LETSRUNIT_AI_PROVIDER;
  delete process.env.LETSRUNIT_MODEL_LARGE;
  delete process.env.LETSRUNIT_MODEL_MEDIUM;
  delete process.env.LETSRUNIT_MODEL_SMALL;
  delete process.env.LANGSMITH_TRACING;
  delete process.env.LANGSMITH_WORKSPACE_ID;
  delete process.env.LANGSMITH_API_KEY;
  delete process.env.LANGSMITH_ENDPOINT;
  delete process.env.LANGSMITH_PROJECT;

  restore = mockAi(generateTextMock as any, generateObjectMock as any);
});

afterEach(() => {
  restore?.();
  restoreLangSmith?.();
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
    expect(passed?.modelId).toBe('gpt-5.4-mini');
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
    expect(passed?.modelId).toBe('gpt-5.5');
    expect(result).toBe('large model output');
  });

  it('omits OpenAI provider options for non-OpenAI providers', async () => {
    process.env.LETSRUNIT_AI_PROVIDER = 'anthropic';
    process.env.LETSRUNIT_MODEL_MEDIUM = 'claude-sonnet-4-6';
    generateTextMock.mockResolvedValue({ text: 'generated text' });

    await generate('system message', 'prompt text');

    expect(generateTextMock).toHaveBeenCalledWith({
      model: expect.anything(),
      system: 'system message',
      prompt: 'prompt text',
    });
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

  it('throws when both schema and tools are provided', async () => {
    const schema = z.object({ a: z.string() });
    await expect(generate('system', 'prompt', { schema, tools: {} as any })).rejects.toThrow(
      "It's not possible to pass both a schema and tools",
    );
  });

  it('throws a clear error when LangSmith is configured but not installed', async () => {
    restore?.();
    restore = undefined;
    process.env.LANGSMITH_TRACING = 'true';
    restoreLangSmith = mockLangSmith(async () => {
      throw new Error('missing langsmith');
    });

    await expect(generate('system', 'prompt')).rejects.toThrow(
      'LangSmith tracing is configured, but `langsmith` is not installed.',
    );
  });
});
