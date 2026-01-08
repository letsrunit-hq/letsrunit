import { describe, expect, it, vi } from 'vitest';
import { chain } from '../src';

describe('chain', () => {
  it('should return true and stop execution if a step returns true', async () => {
    const step1 = vi.fn().mockResolvedValue(false);
    const step2 = vi.fn().mockResolvedValue(true);
    const step3 = vi.fn().mockResolvedValue(true);

    const chained = chain(step1, step2, step3);
    const result = await chained('arg1', 'arg2');

    expect(result).toBe(true);
    expect(step1).toHaveBeenCalledWith('arg1', 'arg2');
    expect(step2).toHaveBeenCalledWith('arg1', 'arg2');
    expect(step3).not.toHaveBeenCalled();
  });

  it('should return false if all steps return false', async () => {
    const step1 = vi.fn().mockResolvedValue(false);
    const step2 = vi.fn().mockResolvedValue(false);

    const chained = chain(step1, step2);
    const result = await chained('test');

    expect(result).toBe(false);
    expect(step1).toHaveBeenCalledWith('test');
    expect(step2).toHaveBeenCalledWith('test');
  });

  it('should return false if no steps are provided', async () => {
    const chained = chain();
    const result = await chained();
    expect(result).toBe(false);
  });
});
