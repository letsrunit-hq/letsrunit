import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@letsrunit/core/ai', () => ({
  generate: vi.fn()
}));

const { htmlToStructuredMarkdown } = await import('../../src/utils/structured-markdown');
const generateMock = vi.mocked((await import('@letsrunit/core/ai')).generate);

describe('htmlToStructuredMarkdown', () => {
  beforeEach(() => {
    generateMock.mockReset();
  });

  it('calls generate with the structured markdown prompt and html input', async () => {
    const htmlInput = '<div>Example</div>';
    generateMock.mockResolvedValue('result markdown');

    const output = await htmlToStructuredMarkdown(htmlInput);

    expect(generateMock).toHaveBeenCalledTimes(1);
    const [promptArg, htmlArg, optionsArg] = generateMock.mock.calls[0];

    expect(promptArg).toContain('You convert raw HTML into **compact Markdown**');
    expect(htmlArg).toBe(htmlInput);
    expect(optionsArg).toEqual({ model: 'medium' });
    expect(output).toBe('result markdown');
  });

  it('propagates the rejection if generate fails', async () => {
    const error = new Error('generation failed');
    generateMock.mockRejectedValue(error);

    await expect(htmlToStructuredMarkdown('<body></body>')).rejects.toBe(error);
  });
});
