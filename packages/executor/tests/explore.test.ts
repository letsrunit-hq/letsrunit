import { Controller } from '@letsrunit/controller';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extractPageInfo } from '../../playwright/src/page-info';
import { assessPage } from '../src/ai/assess-page';
import { describePage } from '../src/ai/describe-page';
import { generateFeature } from '../src/ai/generate-feature';
import explore from '../src/explore';

vi.mock('@letsrunit/controller');
vi.mock('../../playwright/src/page-info');
vi.mock('../src/ai/assess-page');
vi.mock('../src/ai/describe-page');
vi.mock('../src/ai/generate-feature');
vi.mock('@letsrunit/gherkin', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    makeFeature: vi.fn().mockReturnValue('Feature: Explore'),
  };
});

describe('explore', () => {
  const target = 'https://example.com/test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should explore a website successfully', async () => {
    const mockPage = { url: 'https://example.com/test' };
    const mockController = {
      run: vi.fn().mockResolvedValue({ page: mockPage }),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Controller.launch).mockResolvedValue(mockController as any);

    const mockPageInfo = { title: 'Test Page', url: 'https://example.com/test', screenshot: 'screenshot.png' };
    vi.mocked(extractPageInfo).mockResolvedValue(mockPageInfo as any);

    vi.mocked(describePage).mockResolvedValue('Page Content');

    const mockAssessment = {
      purpose: 'Test Purpose',
      loginAvailable: true,
      actions: [
        { name: 'Action 1', description: 'Desc 1', done: 'Done 1' }
      ]
    };
    vi.mocked(assessPage).mockResolvedValue(mockAssessment);

    const process = vi.fn().mockResolvedValue(undefined);

    const result = await explore(target, {}, process);

    expect(Controller.launch).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'https://example.com',
    }));
    expect(mockController.run).toHaveBeenCalledWith('Feature: Explore');
    expect(extractPageInfo).toHaveBeenCalledWith(mockPage);
    expect(describePage).toHaveBeenCalledWith(expect.objectContaining(mockPage), 'markdown');
    expect(assessPage).toHaveBeenCalledWith('Page Content');

    expect(process).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'Test Purpose',
        loginAvailable: true,
        url: 'https://example.com'
      }),
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Action 1',
          run: expect.any(Function)
        })
      ])
    );

    expect(mockController.close).toHaveBeenCalled();
    expect(result).toEqual({ status: 'passed' });

    // Test prepared action run
    const preparedActions = process.mock.calls[0][1];
    vi.mocked(generateFeature).mockResolvedValue({ status: 'passed' } as any);
    await preparedActions[0].run();
    expect(generateFeature).toHaveBeenCalledWith(expect.objectContaining({
      controller: mockController,
      feature: expect.objectContaining({
        name: 'Action 1'
      })
    }));
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(Controller.launch).mockRejectedValue(new Error('Launch failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await explore(target, {}, async () => {});

    expect(result).toEqual({ status: 'error' });
    consoleSpy.mockRestore();
  });
});
