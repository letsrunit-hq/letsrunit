import { afterEach, describe, expect, it } from 'vitest';
import { Given, registry, resetRegistry, resetRegistryToBuiltInSteps } from '../src/index';

describe('registry reload helpers', () => {
  afterEach(() => {
    resetRegistryToBuiltInSteps();
  });

  it('resetRegistry clears all step definitions', () => {
    Given('a temporary custom step for reset test', () => {});
    expect(registry.defs.length).toBeGreaterThan(0);

    resetRegistry();

    expect(registry.defs).toHaveLength(0);
  });

  it('resetRegistryToBuiltInSteps restores built-in definitions', () => {
    const builtInCount = registry.defs.length;
    Given('a temporary custom step for restore test', () => {});
    expect(registry.defs.length).toBe(builtInCount + 1);

    resetRegistryToBuiltInSteps();

    expect(registry.defs.length).toBe(builtInCount);
  });
});
