import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setFieldValue } from '../src';

describe('setFieldValue', () => {
  const createMockLocator = () => {
    const mock = {
      evaluate: vi.fn(),
      selectOption: vi.fn(),
      check: vi.fn(),
      uncheck: vi.fn(),
      getAttribute: vi.fn().mockResolvedValue(null),
      fill: vi.fn(),
      locator: vi.fn(),
      first: vi.fn(),
      last: vi.fn(),
      nth: vi.fn(),
      or: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    } as any;

    mock.locator.mockReturnValue(mock);
    mock.first.mockReturnValue(mock);
    mock.last.mockReturnValue(mock);
    mock.nth.mockReturnValue(mock);
    mock.or.mockReturnValue(mock);

    mock.all = vi.fn().mockResolvedValue([]);

    return mock as unknown as Locator & {
      evaluate: ReturnType<typeof vi.fn>;
      selectOption: ReturnType<typeof vi.fn>;
      check: ReturnType<typeof vi.fn>;
      uncheck: ReturnType<typeof vi.fn>;
      getAttribute: ReturnType<typeof vi.fn>;
      fill: ReturnType<typeof vi.fn>;
      locator: ReturnType<typeof vi.fn>;
    };
  };

  it('sets value for SELECT element', async () => {
    const el = createMockLocator();
    el.evaluate.mockResolvedValue('select');
    el.selectOption.mockResolvedValue(['option1']);

    await setFieldValue(el, 'option1');

    expect(el.evaluate).toHaveBeenCalledWith(expect.any(Function));
    expect(el.selectOption).toHaveBeenCalledWith('option1', undefined);
  });

  it('throws error if option not found in SELECT', async () => {
    const el = createMockLocator();
    el.evaluate.mockResolvedValue('select');
    el.selectOption.mockResolvedValue([]);

    await expect(setFieldValue(el, 'option1')).rejects.toThrow('Option "option1" not found in select');
  });

  it('checks checkbox if value is true', async () => {
    const el = createMockLocator();
    el.evaluate.mockResolvedValue('input');
    el.getAttribute.mockResolvedValue('checkbox');

    await setFieldValue(el, true);

    expect(el.check).toHaveBeenCalled();
    expect(el.uncheck).not.toHaveBeenCalled();
  });

  it('unchecks checkbox if value is false', async () => {
    const el = createMockLocator();
    el.evaluate.mockResolvedValue('input');
    el.getAttribute.mockResolvedValue('checkbox');

    await setFieldValue(el, false);

    expect(el.uncheck).toHaveBeenCalled();
    expect(el.check).not.toHaveBeenCalled();
  });

  describe('Date handling', () => {
    const date = new Date('2024-01-15T12:30:00');

    it('formats date as number', async () => {
      const el = createMockLocator();
      el.evaluate.mockResolvedValue('input');
      el.getAttribute.mockResolvedValue('number');

      await setFieldValue(el, date);

      expect(el.fill).toHaveBeenCalledWith(date.getTime().toString(), undefined);
    });

    it('formats date as datetime-local', async () => {
      const el = createMockLocator();
      el.evaluate.mockResolvedValue('input');
      el.getAttribute.mockResolvedValue('datetime-local');

      await setFieldValue(el, date);

      expect(el.fill).toHaveBeenCalledWith('2024-01-15T12:30', undefined);
    });

    it('formats date as month', async () => {
      const el = createMockLocator();
      el.evaluate.mockResolvedValue('input');
      el.getAttribute.mockResolvedValue('month');

      await setFieldValue(el, date);

      expect(el.fill).toHaveBeenCalledWith('2024-01', undefined);
    });

    it('formats date as week', async () => {
      const el = createMockLocator();
      el.evaluate.mockResolvedValue('input');
      el.getAttribute.mockResolvedValue('week');

      await setFieldValue(el, date);

      expect(el.fill).toHaveBeenCalledWith('2024-W03', undefined);
    });

    it('formats date as time', async () => {
      const el = createMockLocator();
      el.evaluate.mockResolvedValue('input');
      el.getAttribute.mockResolvedValue('time');

      await setFieldValue(el, date);

      expect(el.fill).toHaveBeenCalledWith('12:30', undefined);
    });

    it('formats date as date (default)', async () => {
      const el = createMockLocator();
      el.evaluate.mockResolvedValue('input');
      el.getAttribute.mockResolvedValue('date');

      await setFieldValue(el, date);

      expect(el.fill).toHaveBeenCalledWith('2024-01-15', undefined);
    });

    it('formats date as date when type is null', async () => {
      const el = createMockLocator();
      el.evaluate.mockResolvedValue('input');
      el.getAttribute.mockRejectedValue(new Error('no attribute'));

      await setFieldValue(el, date);

      expect(el.fill).toHaveBeenCalledWith('2024-01-15', undefined);
    });
  });

  it('sets string value', async () => {
    const el = createMockLocator();
    el.evaluate.mockResolvedValue('input');

    await setFieldValue(el, 'test-value');

    expect(el.fill).toHaveBeenCalledWith('test-value', undefined);
  });

  it('sets number value', async () => {
    const el = createMockLocator();
    el.evaluate.mockResolvedValue('input');

    await setFieldValue(el, 123);

    expect(el.fill).toHaveBeenCalledWith('123', undefined);
  });

  it('passes options to playwright methods', async () => {
    const el = createMockLocator();
    el.evaluate.mockResolvedValue('input');
    const options = { force: true, timeout: 5000 };

    await setFieldValue(el, 'test', options);

    expect(el.fill).toHaveBeenCalledWith('test', options);
  });
});
