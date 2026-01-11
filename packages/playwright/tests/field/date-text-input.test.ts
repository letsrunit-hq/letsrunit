import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setDateTextInput } from '../../src/field/date-text-input';

describe('setDateTextInput', () => {
  const createMockLocator = () => {
    const mock = {
      evaluate: vi.fn().mockImplementation(() => Promise.resolve(undefined)),
      fill: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      inputValue: vi.fn().mockResolvedValue(''),
      getAttribute: vi.fn().mockResolvedValue(null),
    } as any;
    return mock as unknown as Locator & {
      evaluate: ReturnType<typeof vi.fn>;
      fill: ReturnType<typeof vi.fn>;
      inputValue: ReturnType<typeof vi.fn>;
      getAttribute: ReturnType<typeof vi.fn>;
    };
  };

  it('sets a single date correctly', async () => {
    const el = createMockLocator();
    const date = new Date(2024, 0, 15); // Jan 15, 2024

    // Mock inferLocaleAndPattern and readOnly
    el.evaluate.mockImplementation(async (fn) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    });

    el.inputValue.mockResolvedValue('01/15/2024');

    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, date);

    expect(result).toBe(true);
    expect(el.fill).toHaveBeenCalledWith('01/15/2024', undefined);
  });

  it('sets multiple dates correctly', async () => {
    const el = createMockLocator();
    const date1 = new Date(2024, 0, 15);
    const date2 = new Date(2024, 0, 16);

    el.evaluate.mockImplementation(async (fn) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    });

    // Mocking the behavior for the format discovery
    // It should format both and set them.
    el.inputValue.mockResolvedValue('01/15/2024, 01/16/2024');

    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, [date1, date2]);

    expect(result).toBe(true);
    expect(el.fill).toHaveBeenCalledWith('01/15/2024,01/16/2024', undefined);
  });

  it('returns false if value is an array with non-Date objects', async () => {
    const el = createMockLocator();
    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, [new Date(), 'not a date'] as any);
    expect(result).toBe(false);
  });

  it('returns false if value is an empty array', async () => {
    const el = createMockLocator();
    el.evaluate.mockImplementation(async (fn) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    });

    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, []);
    expect(result).toBe(false);
  });

  it('returns false if read-back has different number of dates', async () => {
    const el = createMockLocator();
    const date1 = new Date(2024, 0, 15);
    const date2 = new Date(2024, 0, 16);

    el.evaluate.mockImplementation(async (fn) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    });

    el.inputValue.mockResolvedValue('01/15/2024'); // Only one date returned

    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, [date1, date2]);
    expect(result).toBe(false);
  });

  it('handles ambiguous dates with successful probe', async () => {
    const el = createMockLocator();
    const date = new Date(2024, 0, 5); // Jan 5, 2024 (Ambiguous)

    el.evaluate.mockImplementation(async (fn) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    });

    // 1. setDateValue (initial)
    el.inputValue.mockResolvedValueOnce('01/05/2024');
    // 2. tryProbe -> setDateValue (probeDate 22nd)
    el.inputValue.mockResolvedValueOnce('01/22/2024');
    // 3. setDateValue (final)
    el.inputValue.mockResolvedValueOnce('01/05/2024');

    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, date);

    expect(result).toBe(true);
    expect(el.fill).toHaveBeenCalledWith('01/05/2024', undefined);
    expect(el.fill).toHaveBeenCalledWith('01/22/2024', undefined);
  });

  it('handles ambiguous dates with null probe (fallback)', async () => {
    const el = createMockLocator();
    const date = new Date(2024, 0, 5);

    el.evaluate.mockImplementation(async (fn) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    });

    // Use mockImplementation to handle multiple candidates in the loop
    el.inputValue.mockImplementation(async () => {
      const lastFill = el.fill.mock.calls[el.fill.mock.calls.length - 1][0];
      if (lastFill === '01/05/2024' || lastFill === '1/5/2024') return lastFill;
      return ''; // For probes
    });

    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, date);

    expect(result).toBe(true);
    // Should have been called at least for setDateValue and finally setDateValue again (fallback)
    expect(el.fill).toHaveBeenCalledWith('01/05/2024', undefined);
  });

  it('handles different separators and 2-digit years', async () => {
    const el = createMockLocator();
    const date = new Date(2024, 0, 15);

    el.evaluate.mockImplementation(async (fn) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'de-DE', order: ['day', 'month', 'year'], sep: '.' };
      }
      return false; // readOnly
    });

    // We need to mock multiple calls to inputValue because it tries many combinations
    // de-DE locale separator is '.'
    // It will first try with '.' and 4-digit year padded
    el.inputValue.mockResolvedValue('15.01.2024');

    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, date);

    expect(result).toBe(true);
    expect(el.fill).toHaveBeenCalledWith('15.01.2024', undefined);
  });
  
  it('returns false if value is not a Date, Date[] or Range', async () => {
    const el = createMockLocator();
    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, '2024-01-15' as any);
    expect(result).toBe(false);
  });

  it('sets a range of dates correctly', async () => {
    const el = createMockLocator();
    const range = {
      from: new Date(2024, 0, 15),
      to: new Date(2024, 0, 20),
    };

    el.evaluate.mockImplementation(async (fn) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    });

    // setDateValue
    el.inputValue.mockResolvedValueOnce('01/15/2024 - 01/20/2024');

    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, range);

    expect(result).toBe(true);
    expect(el.fill).toHaveBeenCalledWith('01/15/2024 - 01/20/2024', undefined);
  });

  it('returns false if range has non-Date objects', async () => {
    const el = createMockLocator();
    const result = await setDateTextInput({ el, tag: 'input', type: 'text' }, { from: new Date(), to: 'not a date' } as any);
    expect(result).toBe(false);
  });

  it('sets a range using two child inputs and handles focus', async () => {
    const el = createMockLocator();
    const range = {
      from: new Date(2024, 0, 15),
      to: new Date(2024, 0, 20),
    };

    const input1 = createMockLocator();
    const input2 = createMockLocator();
    input1.focus = vi.fn().mockResolvedValue(undefined);
    input2.focus = vi.fn().mockResolvedValue(undefined);

    // Mock el.locator to return the two inputs
    el.locator = vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(2),
      nth: vi.fn().mockImplementation((index) => {
        if (index === 0) return input1;
        if (index === 1) return input2;
        return null;
      }),
    });

    // Mock locale for both inputs
    const mockLocale = async (fn: any) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    };
    input1.evaluate.mockImplementation(mockLocale);
    input2.evaluate.mockImplementation(mockLocale);

    input1.inputValue.mockResolvedValue('01/15/2024');
    input2.inputValue.mockResolvedValue('01/20/2024');

    const result = await setDateTextInput({ el, tag: 'div', type: null }, range);

    expect(result).toBe(true);
    expect(input1.fill).toHaveBeenCalledWith('01/15/2024', undefined);
    expect(input1.focus).not.toHaveBeenCalled(); // input1 itself is not focused by nextInput
    expect(input2.focus).toHaveBeenCalled(); // input2 is focused as nextInput for input1
    expect(input2.fill).toHaveBeenCalledWith('01/20/2024', undefined);
  });

  it('tries next format if second input fails with first format', async () => {
    const el = createMockLocator();
    const range = { from: new Date(2024, 0, 15), to: new Date(2024, 0, 20) };

    const input1 = createMockLocator();
    const input2 = createMockLocator();
    input1.focus = vi.fn().mockResolvedValue(undefined);
    input2.focus = vi.fn().mockResolvedValue(undefined);

    el.locator = vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(2),
      nth: vi.fn().mockImplementation((index) => (index === 0 ? input1 : input2)),
    });

    const mockEvaluate = async (fn: any) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    };
    input1.evaluate.mockImplementation(mockEvaluate);
    input2.evaluate.mockImplementation(mockEvaluate);

    // Mock inputValue to return the last filled value, except for a specific failure
    let input2FailOnce = true;
    const createInputValueMock = (failOnce?: boolean) => async () => {
      const lastFill = failOnce && input2FailOnce ? '' : (el as any).fill.mock.calls[(el as any).fill.mock.calls.length - 1]?.[0];
      if (failOnce) input2FailOnce = false;
      return lastFill || '';
    };

    // Need to use the actual mock objects to access their calls
    input1.inputValue.mockImplementation(async () => {
      return input1.fill.mock.calls[input1.fill.mock.calls.length - 1]?.[0] || '';
    });
    input2.inputValue.mockImplementation(async () => {
      if (input2FailOnce) {
        input2FailOnce = false;
        return '';
      }
      return input2.fill.mock.calls[input2.fill.mock.calls.length - 1]?.[0] || '';
    });

    const result = await setDateTextInput({ el, tag: 'div', type: null }, range);

    expect(result).toBe(true);
    // Should have tried at least two combinations for input1
    expect(input1.fill.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('handles ambiguous dates with two inputs and probing', async () => {
    const el = createMockLocator();
    const range = { from: new Date(2024, 0, 5), to: new Date(2024, 0, 6) }; // Ambiguous

    const input1 = createMockLocator();
    const input2 = createMockLocator();
    input1.focus = vi.fn().mockResolvedValue(undefined);
    input2.focus = vi.fn().mockResolvedValue(undefined);

    el.locator = vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(2),
      nth: vi.fn().mockImplementation((index) => (index === 0 ? input1 : input2)),
    });

    const mockEvaluate = async (fn: any) => {
      if (fn.toString().includes('Intl.DateTimeFormat')) {
        return { locale: 'en-US', order: ['month', 'day', 'year'], sep: '/' };
      }
      return false; // readOnly
    };
    input1.evaluate.mockImplementation(mockEvaluate);
    input2.evaluate.mockImplementation(mockEvaluate);

    // 1. Initial setDateValue for input1 and input2
    input1.inputValue.mockResolvedValueOnce('01/05/2024');
    input2.inputValue.mockResolvedValueOnce('01/06/2024');

    // 2. tryProbe -> setDateValue for input1 (probe 22nd)
    input1.inputValue.mockResolvedValueOnce('01/22/2024');

    // 3. Final setDateValue for input1 and input2
    input1.inputValue.mockResolvedValueOnce('01/05/2024');
    input2.inputValue.mockResolvedValueOnce('01/06/2024');

    const result = await setDateTextInput({ el, tag: 'div', type: null }, range);

    expect(result).toBe(true);
    expect(input1.fill).toHaveBeenCalledWith('01/05/2024', undefined);
    expect(input2.fill).toHaveBeenCalledWith('01/06/2024', undefined);
    expect(input1.fill).toHaveBeenCalledWith('01/22/2024', undefined);
    expect(input1.fill).toHaveBeenCalledTimes(3);
    expect(input2.fill).toHaveBeenCalledTimes(2);
  });
});
