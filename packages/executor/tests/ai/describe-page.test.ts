import { generate } from '@letsrunit/ai';
import { describe, expect, it, vi } from 'vitest';
import { describePage } from '../../src/ai/describe-page';

vi.mock('@letsrunit/ai');

describe('describePage', () => {
  it('should describe page', async () => {
    vi.mocked(generate).mockResolvedValue('Generated Markdown');
    const result = await describePage({
      url: 'https://example.com',
      html: 'h',
      info: { url: 'https://example.com', name: 'T' } as any,
    });
    expect(result).toContain('Generated Markdown');
    expect(result).toContain('name: T');
  });
});
