import { hash } from '@letsrunit/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { translate } from '../src';
import { mockAi } from '../src/generate';

const generateTextMock = vi.fn<any>();
let restore: (() => void) | undefined;

beforeEach(() => {
  generateTextMock.mockReset();
  restore = mockAi(generateTextMock as any);
});

afterEach(() => {
  restore?.();
});

describe('translate', () => {
  it('returns the original input when the language resolves to English', async () => {
    const input = { greeting: 'Hello' } as const;

    const result = await translate(input, 'en_US');

    expect(result).toBe(input);
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it('translates string inputs and caches the generated value', async () => {
    const cacheKey = `${hash('Hello world')}:en:fr`;
    const cache = {
      wrap: vi.fn(async (_key: string, fn: () => Promise<any>) => await fn()),
    } as any;
    generateTextMock.mockResolvedValue({ text: 'Bonjour le monde' });

    const result = await translate('Hello world', 'fr_FR', { cache });

    expect(cache.wrap).toHaveBeenCalledWith(cacheKey, expect.any(Function));

    expect(generateTextMock).toHaveBeenCalledWith({
      model: expect.anything(),
      system: 'Translate the text from English to French.',
      prompt: 'Hello world',
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });
    const passed = (generateTextMock.mock.calls[0][0] as any).model;
    expect(passed?.modelId).toBe('gpt-5-nano');

    expect(result).toBe('Bonjour le monde');
  });

  it('translates structured JSON with a custom prompt and fallback language name', async () => {
    const input = { greeting: 'Hello', details: { count: 2 } } as const;
    const jsonString = JSON.stringify(input, null, 2);
    generateTextMock.mockResolvedValue({ text: '{"greeting":"Bonjour","details":{"count":2}}' });

    const result = await translate(input, 'xx_001', { prompt: 'Custom prompt for {lang}' });

    expect(generateTextMock).toHaveBeenCalledWith({
      model: expect.anything(),
      system: 'Custom prompt for xx',
      prompt: jsonString,
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });
    expect(result).toEqual({ greeting: 'Bonjour', details: { count: 2 } });
    expect(result).not.toBe(input);
  });

  it('returns cached values without invoking the AI model', async () => {
    const cacheKey = `${hash('Needs cache')}:en:es`;
    const cache = {
      wrap: vi.fn().mockResolvedValue('Desde caché'),
    } as any;

    const result = await translate('Needs cache', 'es', { cache });

    expect(cache.wrap).toHaveBeenCalledWith(cacheKey, expect.any(Function));
    expect(generateTextMock).not.toHaveBeenCalled();
    expect(result).toBe('Desde caché');
  });
});
