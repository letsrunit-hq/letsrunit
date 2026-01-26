import { generate } from '@letsrunit/ai';
import { describe, expect, it, vi } from 'vitest';
import { analyseEmail } from '../src/ai/analyse-email';
import { assessPage } from '../src/ai/assess-page';
import { describePage } from '../src/ai/describe-page';
import { detectPageChanges } from '../src/ai/detect-page-changes';
import { refineSuggestion } from '../src/ai/refine-suggestion';

vi.mock('@letsrunit/ai');
vi.mock('../../../playwright/src/scrub-html', () => ({
  scrubHtml: vi.fn().mockResolvedValue('Scrubbed HTML'),
}));
vi.mock('../../../playwright/src/unified-html-diff', () => ({
  unifiedHtmlDiff: vi.fn().mockResolvedValue('HTML Diff'),
}));

describe('AI Functions', () => {
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

  describe('analyseEmail', () => {
    it('should analyse email', async () => {
      vi.mocked(generate).mockResolvedValue({ otp: { value: '123', selector: 's' } });
      const result = await analyseEmail('Email body');
      expect(result.otp?.value).toBe('123');
    });
  });

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
});
