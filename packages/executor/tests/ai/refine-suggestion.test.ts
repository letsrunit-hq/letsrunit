import { generate } from '@letsrunit/ai';
import { describe, expect, it, vi } from 'vitest';
import { refineSuggestion } from '../../src/ai/refine-suggestion';

vi.mock('@letsrunit/ai');

describe('refineSuggestion', () => {
  it('should refine a string suggestion', async () => {
    vi.mocked(generate).mockResolvedValue({
      name: 'Refined Name',
      description: 'Refined Desc',
      done: 'Refined Done',
    });

    const result = await refineSuggestion('I want to test login');

    expect(result).toEqual({
      name: 'Refined Name',
      description: 'Refined Desc',
      comments: 'Definition of done: Refined Done',
    });
    expect(generate).toHaveBeenCalledWith(expect.any(String), 'I want to test login', expect.any(Object));
  });

  it('should refine an object suggestion', async () => {
    vi.mocked(generate).mockResolvedValue({
      name: 'Refined Name',
      description: 'Refined Desc',
      done: 'Refined Done',
    });

    const result = await refineSuggestion({ name: 'Test', description: 'Desc', comments: 'Comm' });

    expect(generate).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('# Test'), expect.any(Object));
  });

  it('should throw if no instructions', async () => {
    await expect(refineSuggestion('')).rejects.toThrow('No test instructions');
  });
});
