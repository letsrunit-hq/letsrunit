import { describe, it, expect, afterAll, vi } from 'vitest';
import { runner } from '../../../src/runner/dsl';
import '../../../src/runner/parameters';
import '../../../src/runner/steps/keyboard';


describe('steps/keyboard (runner)', () => {
  afterAll(() => runner.reset());

  it('presses modifiers then key, then releases modifiers in reverse order', async () => {
    const down = vi.fn();
    const up = vi.fn();
    const press = vi.fn();
    const page = { keyboard: { down, up, press } } as any;

    const feature = `
      Feature: Keyboard
        Scenario: combo
          When I press "Ctrl+Shift+K"
    `;

    await runner.run(feature, { page } as any);

    expect(down.mock.calls.map(c => c[0])).toEqual(['Control', 'Shift']);
    expect(press).toHaveBeenCalledWith('K');
    expect(up.mock.calls.map(c => c[0])).toEqual(['Shift', 'Control']);
  });
});
