import { generate } from '@letsrunit/ai';
import { describe, expect, it, vi } from 'vitest';
import { detectPageChanges } from '../../src/ai/detect-page-changes';

vi.mock('@letsrunit/ai');

describe('detectPageChanges', () => {
  it('should detect changes', async () => {
    vi.mocked(generate).mockResolvedValue('Then I see X\nThen I do not see Y');
    const result = await detectPageChanges(
      { html: 'h1', url: 'https://example.com' },
      { html: 'h2', url: 'https://example.com' },
    );
    expect(result).toEqual(['Then I see X', 'Then I do not see Y']);
  });

  it('should handle no changes', async () => {
    vi.mocked(generate).mockResolvedValue('Then I do not see any changes');
    const result = await detectPageChanges(
      { html: 'h1', url: 'https://example.com' },
      { html: 'h2', url: 'https://example.com' },
    );
    expect(result).toEqual([]);
  });
});
