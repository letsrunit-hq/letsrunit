import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hash } from '@letsrunit/core/utils';

type AnyFn = (...args: any[]) => any;

const generateMock = vi.fn<AnyFn>();

vi.mock('../../src/ai/generate', () => ({
  generate: generateMock,
}));

describe('translate', () => {
  const importModule = () => import('@letsrunit/core/ai/translate');

  beforeEach(() => {
    vi.resetModules();
    generateMock.mockReset();
  });

  it('returns the original input when the language resolves to English', async () => {
    const { translate } = await importModule();
    const input = { greeting: 'Hello' } as const;

    const result = await translate(input, 'en_US');

    expect(result).toBe(input);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('translates string inputs and caches the generated value', async () => {
    const { translate } = await importModule();
    const cacheKey = `${hash('Hello world')}:en:fr`;
    const cache = {
      get: vi.fn().mockResolvedValueOnce(undefined),
      set: vi.fn(),
      has: vi.fn(),
    };
    generateMock.mockResolvedValue('Bonjour le monde');

    const result = await translate('Hello world', 'fr_FR', { cache });

    expect(cache.get).toHaveBeenCalledWith(cacheKey);
    expect(generateMock).toHaveBeenCalledWith(
      'Translate the text from English to French.',
      'Hello world',
      { model: 'small' },
    );
    expect(cache.set).toHaveBeenCalledWith(cacheKey, 'Bonjour le monde');
    expect(result).toBe('Bonjour le monde');
  });

  it('translates structured JSON with a custom prompt and fallback language name', async () => {
    const { translate } = await importModule();
    const input = { greeting: 'Hello', details: { count: 2 } } as const;
    const jsonString = JSON.stringify(input, null, 2);
    generateMock.mockResolvedValue('{"greeting":"Bonjour","details":{"count":2}}');

    const result = await translate(input, 'xx_001', { prompt: 'Custom prompt for {lang}' });

    expect(generateMock).toHaveBeenCalledWith('Custom prompt for xx', jsonString, { model: 'small' });
    expect(result).toEqual({ greeting: 'Bonjour', details: { count: 2 } });
    expect(result).not.toBe(input);
  });

  it('returns cached values without invoking the AI model', async () => {
    const { translate } = await importModule();
    const cacheKey = `${hash('Needs cache')}:en:es`;
    const cache = {
      get: vi.fn().mockResolvedValue('Desde caché'),
      set: vi.fn(),
      has: vi.fn(),
    };

    const result = await translate('Needs cache', 'es', { cache });

    expect(cache.get).toHaveBeenCalledWith(cacheKey);
    expect(generateMock).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(result).toBe('Desde caché');
  });
});
