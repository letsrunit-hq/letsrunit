import { Controller } from '@letsrunit/controller';
import { makeFeature } from '@letsrunit/gherkin';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import run from '../src/run';

vi.mock('@letsrunit/controller');
vi.mock('@letsrunit/gherkin', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    makeFeature: vi.fn().mockReturnValue('Feature: Mocked'),
  };
});

describe('run', () => {
  const target = 'https://example.com/test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run a feature string successfully', async () => {
    const mockController = {
      run: vi.fn().mockResolvedValue({ status: 'passed' }),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Controller.launch).mockResolvedValue(mockController as any);

    const result = await run(target, 'Feature: Test');

    expect(Controller.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://example.com',
      }),
    );
    expect(mockController.run).toHaveBeenCalledWith('Feature: Test');
    expect(mockController.close).toHaveBeenCalled();
    expect(result).toEqual({ status: 'passed' });
  });

  it('should run a Feature object successfully', async () => {
    const mockController = {
      run: vi.fn().mockResolvedValue({ status: 'passed' }),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Controller.launch).mockResolvedValue(mockController as any);
    const featureObj = { name: 'Test', steps: [] };

    const result = await run(target, featureObj as any);

    expect(makeFeature).toHaveBeenCalledWith(featureObj);
    expect(mockController.run).toHaveBeenCalledWith('Feature: Mocked');
    expect(result).toEqual({ status: 'passed' });
  });

  it('should handle errors gracefully', async () => {
    const mockController = {
      run: vi.fn().mockRejectedValue(new Error('Test Error')),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Controller.launch).mockResolvedValue(mockController as any);

    // Silence console.error for tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await run(target, 'Feature: Test');

    expect(result).toEqual({ status: 'error' });
    expect(mockController.close).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
