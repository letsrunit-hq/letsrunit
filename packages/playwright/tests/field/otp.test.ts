import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setOtpValue } from '../../src/field/otp';

describe('setOtpValue', () => {
  const createMockLocator = (inputs: any[] = []) => {
    return {
      locator: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue(inputs),
      }),
    } as unknown as Locator;
  };

  const createInputMock = () => ({
    fill: vi.fn().mockResolvedValue(undefined),
  });

  it('returns false if value is not a string', async () => {
    const result = await setOtpValue({ el: {} as any, tag: 'div', type: null }, 123 as any);
    expect(result).toBe(false);
  });

  it('returns false if tag is a form element', async () => {
    const tags = ['input', 'select', 'button', 'textarea'];
    for (const tag of tags) {
      const result = await setOtpValue({ el: {} as any, tag, type: null }, '1234');
      expect(result).toBe(false);
    }
  });

  it('returns false if OTP length is less than 3', async () => {
    const result = await setOtpValue({ el: {} as any, tag: 'div', type: null }, '12');
    expect(result).toBe(false);
  });

  it('returns false if OTP length is more than 8', async () => {
    const result = await setOtpValue({ el: {} as any, tag: 'div', type: null }, '123456789');
    expect(result).toBe(false);
  });

  it('returns false if number of inputs does not match OTP length', async () => {
    const inputMocks = [createInputMock(), createInputMock()];
    const elMock = createMockLocator(inputMocks);
    const result = await setOtpValue({ el: elMock, tag: 'div', type: null }, '123');
    expect(result).toBe(false);
  });

  it('fills inputs and returns true if everything is correct', async () => {
    const inputMocks = [createInputMock(), createInputMock(), createInputMock()];
    const elMock = createMockLocator(inputMocks);
    const result = await setOtpValue({ el: elMock, tag: 'div', type: null }, '123');

    expect(result).toBe(true);
    expect(elMock.locator).toHaveBeenCalledWith('input[type="text"], input:not([type])');
    expect(inputMocks[0].fill).toHaveBeenCalledWith('1', undefined);
    expect(inputMocks[1].fill).toHaveBeenCalledWith('2', undefined);
    expect(inputMocks[2].fill).toHaveBeenCalledWith('3', undefined);
  });

  it('handles non-digit characters in value', async () => {
    const inputMocks = [createInputMock(), createInputMock(), createInputMock()];
    const elMock = createMockLocator(inputMocks);
    const result = await setOtpValue({ el: elMock, tag: 'div', type: null }, '1-2 3');

    expect(result).toBe(true);
    expect(inputMocks[0].fill).toHaveBeenCalledWith('1', undefined);
    expect(inputMocks[1].fill).toHaveBeenCalledWith('2', undefined);
    expect(inputMocks[2].fill).toHaveBeenCalledWith('3', undefined);
  });

  it('passes options to fill', async () => {
    const inputMocks = [createInputMock(), createInputMock(), createInputMock()];
    const elMock = createMockLocator(inputMocks);
    const options = { force: true };
    await setOtpValue({ el: elMock, tag: 'div', type: null }, '123', options);

    expect(inputMocks[0].fill).toHaveBeenCalledWith('1', options);
  });
});
