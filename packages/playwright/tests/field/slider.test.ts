import type { Page } from '@playwright/test';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { setSliderValue } from '../../src/field/slider';

describe('setSliderValue', () => {
  const createMockSlider = (attrs: Record<string, string | null> = {}, box = { x: 100, y: 100, width: 200, height: 20 }) => {
    const pageMock = {
      mouse: {
        move: vi.fn().mockResolvedValue(undefined),
        down: vi.fn().mockResolvedValue(undefined),
        up: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Page;

    const sliderMock = {
      getAttribute: vi.fn().mockImplementation((name: string) => Promise.resolve(attrs[name] || null)),
      isVisible: vi.fn().mockResolvedValue(true),
      boundingBox: vi.fn().mockResolvedValue(box),
      scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
      page: vi.fn().mockReturnValue(pageMock),
      getByRole: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
      first: vi.fn().mockReturnValue(null),
    } as unknown as any;
    sliderMock.first.mockReturnValue(sliderMock);

    return { sliderMock, pageMock };
  };

  it('returns false if value is not a number', async () => {
    const result = await setSliderValue({ el: {} as any, tag: 'div', type: null }, '10' as any);
    expect(result).toBe(false);
  });

  it('returns false if tag is a form element', async () => {
    const tags = ['input', 'select', 'button', 'textarea'];
    for (const tag of tags) {
      const result = await setSliderValue({ el: {} as any, tag, type: null }, 50);
      expect(result).toBe(false);
    }
  });

  it('handles horizontal slider', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '20',
      'aria-orientation': 'horizontal',
    };
    const { sliderMock, pageMock } = createMockSlider(attrs);

    // Mock the change of aria-valuenow after test move
    sliderMock.getAttribute.mockImplementation((name: string) => {
      if (name === 'aria-valuenow') {
        if (sliderMock.getAttribute.mock.calls.length > 5) {
          return Promise.resolve('25'); // value after test move
        }
        return Promise.resolve('20'); // initial value
      }
      return Promise.resolve(attrs[name as keyof typeof attrs] || null);
    });

    const result = await setSliderValue({ el: sliderMock, tag: 'div', type: null }, 50);

    expect(result).toBe(true);
    expect(pageMock.mouse.down).toHaveBeenCalled();
    expect(pageMock.mouse.move).toHaveBeenCalled();
    expect(pageMock.mouse.up).toHaveBeenCalled();

    // Center: 100 + 200/2 = 200, 100 + 20/2 = 110
    expect(pageMock.mouse.move).toHaveBeenNthCalledWith(1, 200, 110);
    // Test move: 200 + 20 = 220
    expect(pageMock.mouse.move).toHaveBeenNthCalledWith(2, 220, 110);

    // ratio = (25 - 20) / 20 = 0.25
    // distance = (50 - 20) / 0.25 = 120
    // final move: 200 + 120 = 320
    expect(pageMock.mouse.move).toHaveBeenNthCalledWith(3, 320, 110);
  });

  it('handles vertical slider', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '20',
      'aria-orientation': 'vertical',
    };
    const box = { x: 100, y: 100, width: 20, height: 200 };
    const { sliderMock, pageMock } = createMockSlider(attrs, box);

    sliderMock.getAttribute.mockImplementation((name: string) => {
      if (name === 'aria-valuenow') {
        if (sliderMock.getAttribute.mock.calls.length > 5) {
          return Promise.resolve('25');
        }
        return Promise.resolve('20');
      }
      return Promise.resolve(attrs[name as keyof typeof attrs] || null);
    });

    const result = await setSliderValue({ el: sliderMock, tag: 'div', type: null }, 50);

    expect(result).toBe(true);
    // Center: 100 + 20/2 = 110, 100 + 200/2 = 200
    expect(pageMock.mouse.move).toHaveBeenNthCalledWith(1, 110, 200);
    // Test move: 200 - 20 = 180
    expect(pageMock.mouse.move).toHaveBeenNthCalledWith(2, 110, 180);

    // ratio = (25 - 20) / 20 = 0.25
    // distance = (50 - 20) / 0.25 = 120
    // final move: 200 - 120 = 80
    expect(pageMock.mouse.move).toHaveBeenNthCalledWith(3, 110, 80);
  });

  it('finds slider as a child if not el itself', async () => {
    const { sliderMock: parentMock } = createMockSlider({ role: 'not-slider' });
    const { sliderMock: childMock } = createMockSlider({
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '20',
    });

    parentMock.getAttribute = vi.fn().mockResolvedValue('not-slider');
    parentMock.getByRole.mockReturnValue(childMock);
    childMock.count.mockResolvedValue(1);

    let callCount = 0;
    childMock.getAttribute.mockImplementation((name: string) => {
      if (name === 'aria-valuenow') {
        callCount++;
        if (callCount > 1) return Promise.resolve('25');
        return Promise.resolve('20');
      }
      if (name === 'aria-valuemin') return Promise.resolve('0');
      if (name === 'aria-valuemax') return Promise.resolve('100');
      if (name === 'aria-orientation') return Promise.resolve('horizontal');
      return Promise.resolve(null);
    });

    const result = await setSliderValue({ el: parentMock, tag: 'div', type: null }, 50);

    expect(result).toBe(true);
    expect(parentMock.getByRole).toHaveBeenCalledWith('slider');
  });

  it('returns false if slider is not found', async () => {
    const { sliderMock } = createMockSlider({ role: 'not-slider' });
    sliderMock.getAttribute.mockResolvedValue('not-slider');
    sliderMock.getByRole.mockReturnValue(sliderMock);
    sliderMock.count.mockResolvedValue(0);

    const result = await setSliderValue({ el: sliderMock, tag: 'div', type: null }, 50);
    expect(result).toBe(false);
  });

  it('throws error if value is out of range', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
    };
    const { sliderMock } = createMockSlider(attrs);
    await expect(setSliderValue({ el: sliderMock, tag: 'div', type: null }, 150)).rejects.toThrow('Value 150 is out of range [0, 100]');
    await expect(setSliderValue({ el: sliderMock, tag: 'div', type: null }, -10)).rejects.toThrow('Value -10 is out of range [0, 100]');
  });

  it('returns false if aria-valuenow is missing', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
    };
    const { sliderMock } = createMockSlider(attrs);
    sliderMock.getAttribute.mockImplementation((name: string) => {
      if (name === 'aria-valuenow') return Promise.resolve(null);
      return Promise.resolve(attrs[name as keyof typeof attrs] || null);
    });
    const result = await setSliderValue({ el: sliderMock, tag: 'div', type: null }, 50);
    expect(result).toBe(false);
  });

  it('returns true if value is already correct', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '50',
    };
    const { sliderMock, pageMock } = createMockSlider(attrs);
    const result = await setSliderValue({ el: sliderMock, tag: 'div', type: null }, 50);
    expect(result).toBe(true);
    expect(pageMock.mouse.down).not.toHaveBeenCalled();
  });

  it('throws error if slider has no bounding box', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '20',
    };
    const { sliderMock } = createMockSlider(attrs);
    sliderMock.boundingBox.mockResolvedValue(null);
    await expect(setSliderValue({ el: sliderMock, tag: 'div', type: null }, 50)).rejects.toThrow('Slider has no bounding box');
  });

  it('throws error if slider is unresponsive (diff is 0)', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '50',
    };
    const { sliderMock } = createMockSlider(attrs);
    sliderMock.getAttribute.mockResolvedValue('50'); // Always returns 50
    sliderMock.getAttribute.mockImplementation((name: string) => {
      if (name === 'role') return Promise.resolve('slider');
      if (name === 'aria-valuemin') return Promise.resolve('0');
      if (name === 'aria-valuemax') return Promise.resolve('100');
      if (name === 'aria-valuenow') return Promise.resolve('50');
      return Promise.resolve(null);
    });

    await expect(setSliderValue({ el: sliderMock, tag: 'div', type: null }, 70)).rejects.toThrow('Slider appears to be disabled or unresponsive');
  });

  it('moves in the direction of the value', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '50',
      'aria-orientation': 'horizontal',
    };
    const { sliderMock, pageMock } = createMockSlider(attrs);

    // Test moving up
    let callCount = 0;
    sliderMock.getAttribute.mockImplementation((name: string) => {
      if (name === 'aria-valuenow') {
        callCount++;
        if (callCount === 1) return Promise.resolve('50'); // initial
        if (callCount === 2) return Promise.resolve('55'); // after test move
        return Promise.resolve('70'); // final
      }
      return Promise.resolve(attrs[name as keyof typeof attrs] || null);
    });

    await setSliderValue({ el: sliderMock, tag: 'div', type: null }, 70);
    // Center is 200. Test move should be 200 + 20 = 220
    expect(pageMock.mouse.move).toHaveBeenNthCalledWith(2, 220, 110);

    // Test moving down
    callCount = 0;
    (pageMock.mouse.move as Mock).mockClear();
    await setSliderValue({ el: sliderMock, tag: 'div', type: null }, 30);
    // Center is 200. Test move should be 200 - 20 = 180
    expect(pageMock.mouse.move).toHaveBeenNthCalledWith(2, 180, 110);
  });

  it('fine tunes the value if needed', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '50',
      'aria-orientation': 'horizontal',
    };
    const { sliderMock, pageMock } = createMockSlider(attrs);

    let callCount = 0;
    sliderMock.getAttribute.mockImplementation((name: string) => {
      if (name === 'aria-valuenow') {
        callCount++;
        if (callCount === 1) return Promise.resolve('50'); // initial
        if (callCount === 2) return Promise.resolve('55'); // after test move
        if (callCount === 3) return Promise.resolve('68'); // first check in loop
        if (callCount === 4) return Promise.resolve('70'); // second check in loop
        return Promise.resolve('70');
      }
      return Promise.resolve(attrs[name as keyof typeof attrs] || null);
    });

    await setSliderValue({ el: sliderMock, tag: 'div', type: null }, 70);

    // ratio = (55 - 50) / 10 = 0.5
    // 1. center move (200, 110)
    // 2. test move (210, 110)
    // 3. first target move (240, 110)
    // 4. fine tune move (240, 110) - value is 68 -> move to 70
    // Actually, in the code:
    // valAfterMove is 55.
    // distance = (70 - 55) / 0.5 = 30.
    // centerX + testMove + distance = 200 + 10 + 30 = 240.
    // In loop:
    // i=0: currentVal is 68. diffToTarget = 2.
    // ratio = |5 / 10| = 0.5.
    // totalDiff = 70 - 50 = 20.
    // totalDistance = 20 / 0.5 = 40.
    // move(centerX + totalDistance, centerY) = (240, 110).
    // i=1: currentVal is 70. BREAK.

    expect(pageMock.mouse.move).toHaveBeenCalledTimes(4); // center, test, initial target, 1 fine-tune
  });

  it('passes options to playwright calls', async () => {
    const attrs = {
      role: 'slider',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '20',
      'aria-orientation': 'horizontal',
    };
    const { sliderMock } = createMockSlider(attrs);
    const options = { timeout: 5000 };

    // Mock successful run
    sliderMock.getAttribute.mockImplementation((name: string) => {
      if (name === 'aria-valuenow' && sliderMock.getAttribute.mock.calls.length > 5) return Promise.resolve('25');
      return Promise.resolve(attrs[name as keyof typeof attrs] || null);
    });

    await setSliderValue({ el: sliderMock, tag: 'div', type: null }, 50, options);

    expect(sliderMock.getAttribute).toHaveBeenCalledWith('aria-valuemin', options);
    expect(sliderMock.boundingBox).toHaveBeenCalledWith(options);
    expect(sliderMock.scrollIntoViewIfNeeded).toHaveBeenCalledWith(options);
  });
});
