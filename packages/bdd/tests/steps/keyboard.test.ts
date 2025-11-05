import { describe, it, expect, vi } from 'vitest';
import { runStep } from '../helpers';
import { press as pressStep } from '../../src/steps/keyboard';


describe('steps/keyboard (definitions)', () => {
  it('presses modifiers then key, then releases modifiers in reverse order', async () => {
    const down = vi.fn();
    const up = vi.fn();
    const press = vi.fn();
    const page = { keyboard: { down, up, press } } as any;

    await runStep(pressStep, 'I press "Ctrl+Shift+K"', { page } as any);

    expect(down.mock.calls.map(c => c[0])).toEqual(['Control', 'Shift']);
    expect(press).toHaveBeenCalledWith('K');
    expect(up.mock.calls.map(c => c[0])).toEqual(['Shift', 'Control']);
  });
});
