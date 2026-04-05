import { generate } from '@letsrunit/ai';
import { describe, expect, it, vi } from 'vitest';
import { assessPage } from '../../src/ai/assess-page';

vi.mock('@letsrunit/ai');

describe('assessPage', () => {
  it('should include websiteName when provided', async () => {
    vi.mocked(generate).mockResolvedValue({
      websiteName: 'MySite',
      purpose: 'Testing',
      loginAvailable: false,
      actions: [],
    });
    const result = await assessPage('<html></html>');
    expect(result.websiteName).toBe('MySite');
  });

  it('should call generate with correct prompt for HTML', async () => {
    vi.mocked(generate).mockResolvedValue({ purpose: 'P', loginAvailable: true, actions: [] });
    await assessPage('<html></html>');
    expect(generate).toHaveBeenCalledWith(
      expect.stringContaining('A scrubbed HTML body'),
      '<html></html>',
      expect.any(Object),
    );
  });

  it('should call generate with correct prompt for non-HTML', async () => {
    vi.mocked(generate).mockResolvedValue({ purpose: 'P', loginAvailable: true, actions: [] });
    await assessPage('Some markdown');
    expect(generate).toHaveBeenCalledWith(
      expect.stringContaining('Markdown version'),
      'Some markdown',
      expect.any(Object),
    );
  });
});
