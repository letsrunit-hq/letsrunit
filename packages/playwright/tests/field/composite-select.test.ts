import type { Locator } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { setCompositeSelect } from '../../src/field/composite-select';

describe('setCompositeSelect', () => {
  it('falls back to keyboard navigation when numeric label click detaches', async () => {
    let currentValue = 20;
    let popupOpen = false;
    let pendingValue = currentValue;

    const optionCandidate: any = {
      count: vi.fn().mockResolvedValue(1),
      first: vi.fn(),
      click: vi.fn().mockRejectedValue(new Error('element was detached from the DOM')),
      getAttribute: vi.fn().mockImplementation((attr: string) => {
        if (attr === 'title') return Promise.resolve('Ten');
        return Promise.resolve(null);
      }),
      textContent: vi.fn().mockResolvedValue('Ten'),
    };
    optionCandidate.first.mockReturnValue(optionCandidate);

    const optionsLoc: any = {
      count: vi.fn().mockResolvedValue(1),
      nth: vi.fn().mockReturnValue(optionCandidate),
    };

    const popup: any = {
      locator: vi.fn().mockImplementation((selector: string) => {
        if (selector.includes('[value="10"]') || selector.includes('[data-value="10"]') || selector.includes('[aria-label="10"]')) {
          return { count: vi.fn().mockResolvedValue(0), first: vi.fn().mockReturnValue(null) };
        }
        if (selector === '[role="option"], [title]') return optionsLoc;
        if (selector === '[title="Ten"]') return optionCandidate;
        return { count: vi.fn().mockResolvedValue(0), first: vi.fn().mockReturnValue(null) };
      }),
      getByRole: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(0), first: vi.fn().mockReturnValue(null) }),
      getByText: vi.fn().mockReturnValue(optionCandidate),
    };

    const popupCollection: any = {
      count: vi.fn().mockImplementation(() => Promise.resolve(popupOpen ? 1 : 0)),
      first: vi.fn(),
      nth: vi.fn().mockReturnValue(popup),
      waitFor: vi.fn().mockImplementation(() => {
        popupOpen = true;
        return Promise.resolve(undefined);
      }),
    };
    popupCollection.first.mockReturnValue(popupCollection);

    const activator: any = {
      count: vi.fn().mockResolvedValue(1),
      first: vi.fn(),
      click: vi.fn().mockImplementation(() => {
        popupOpen = true;
        return Promise.resolve(undefined);
      }),
    };
    activator.first.mockReturnValue(activator);

    const resultField: any = {
      count: vi.fn().mockResolvedValue(1),
      first: vi.fn(),
      textContent: vi.fn().mockImplementation(() => Promise.resolve(String(currentValue))),
    };
    resultField.first.mockReturnValue(resultField);

    const keyboard = {
      press: vi.fn().mockImplementation((key: string) => {
        if (key === 'ArrowUp') pendingValue = 10;
        if (key === 'Enter') currentValue = pendingValue;
        return Promise.resolve(undefined);
      }),
    };

    const page = {
      locator: vi.fn().mockImplementation((selector: string) => {
        if (selector === '[role="listbox"]:visible, [role="menu"]:visible, [role="dialog"]:visible, [role="presentation"]:visible, .cdk-overlay-pane:visible') {
          return popupCollection;
        }
        return popupCollection;
      }),
      getByLabel: vi.fn().mockImplementation((label: string) => {
        if (label === 'result') return resultField;
        return { first: vi.fn().mockReturnValue({ count: vi.fn().mockResolvedValue(0) }) };
      }),
      keyboard,
    };

    const cues: any = { count: vi.fn().mockResolvedValue(1) };
    const none: any = { count: vi.fn().mockResolvedValue(0) };

    const el = {
      getAttribute: vi.fn().mockImplementation((attr: string) => {
        if (attr === 'role') return Promise.resolve(null);
        return Promise.resolve(null);
      }),
      locator: vi.fn().mockImplementation((selector: string) => {
        if (selector === 'button[aria-haspopup], [role="button"][aria-haspopup], input[readonly]') return activator;
        if (selector === 'input[type="radio"], input[type="checkbox"]') return none;
        if (selector === '[role="slider"], [aria-valuenow]') return none;
        if (selector === '[aria-haspopup], [aria-controls], [aria-owns], input[readonly], button[aria-haspopup]') return cues;
        return none;
      }),
      click: vi.fn().mockImplementation(() => {
        popupOpen = true;
        return Promise.resolve(undefined);
      }),
      evaluate: vi.fn().mockResolvedValue('Twenty'),
      focus: vi.fn().mockResolvedValue(undefined),
      page: vi.fn().mockReturnValue(page),
    } as unknown as Locator;

    const result = await setCompositeSelect({ el, tag: 'div', type: null }, '10', { timeout: 1000 });

    expect(result).toBe(true);
    expect(optionCandidate.click).toHaveBeenCalled();
    expect(keyboard.press).toHaveBeenCalledWith('ArrowUp');
    expect(keyboard.press).toHaveBeenCalledWith('Enter');
  });
});
