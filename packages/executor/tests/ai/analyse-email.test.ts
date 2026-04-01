import { generate } from '@letsrunit/ai';
import { describe, expect, it, vi } from 'vitest';
import { analyseEmail } from '../../src/ai/analyse-email';

vi.mock('@letsrunit/ai');

describe('analyseEmail', () => {
  it('should analyse email', async () => {
    vi.mocked(generate).mockResolvedValue({ otp: { value: '123', selector: 's' } });
    const result = await analyseEmail('Email body');
    expect(result.otp?.value).toBe('123');
  });
});
