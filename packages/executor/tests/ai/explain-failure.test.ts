import { generate } from '@letsrunit/ai';
import { describe, expect, it, vi } from 'vitest';
import { explainFailure } from '../../src/ai/explain-failure';

vi.mock('@letsrunit/ai');

describe('explainFailure', () => {
  it('should explain failure', async () => {
    vi.mocked(generate).mockResolvedValue({
      update: 'test',
      reason: 'Reason',
      advice: 'Advice',
    });
    const result = await explainFailure('Input');
    expect(result).toEqual({
      update: 'test',
      reason: 'Reason',
      advice: 'Advice',
    });
    expect(generate).toHaveBeenCalledWith(expect.stringContaining('Classify the failure as:'), 'Input', expect.any(Object));
  });
});
