import { Controller } from '@letsrunit/controller';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateFeature } from '../src/ai/generate-feature';
import generate from '../src/generate';

vi.mock('@letsrunit/controller');
vi.mock('../src/ai/generate-feature');

describe('generate', () => {
  const target = 'https://example.com/test';
  const suggestion = { name: 'Test Story', description: 'Description' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call generateFeature with correct parameters', async () => {
    const mockController = {
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Controller.launch).mockResolvedValue(mockController as any);
    vi.mocked(generateFeature).mockResolvedValue({ status: 'passed' } as any);

    const result = await generate(target, suggestion);

    expect(Controller.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://example.com',
      }),
    );
    expect(generateFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        controller: mockController,
        feature: expect.objectContaining({
          name: 'Test Story',
          background: ['Given I\'m on page "/test"', 'And all popups are closed'],
        }),
      }),
    );
    expect(mockController.close).toHaveBeenCalled();
    expect(result).toEqual({ status: 'passed' });
  });

  it('should handle homepage path correctly', async () => {
    const mockController = {
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Controller.launch).mockResolvedValue(mockController as any);
    vi.mocked(generateFeature).mockResolvedValue({ status: 'passed' } as any);

    await generate('https://example.com/', suggestion);

    expect(generateFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: expect.objectContaining({
          background: ["Given I'm on the homepage", 'And all popups are closed'],
        }),
      }),
    );
  });

  it('should handle timeout option', async () => {
    const mockController = {
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Controller.launch).mockResolvedValue(mockController as any);
    vi.mocked(generateFeature).mockResolvedValue({ status: 'passed' } as any);

    await generate(target, suggestion, { timeout: 1000 });

    expect(generateFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(Controller.launch).mockImplementation(() => {
      throw new Error('Launch failed');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await generate(target, suggestion);
    expect(result).toEqual({ status: 'error' });
    consoleSpy.mockRestore();
  });
});
