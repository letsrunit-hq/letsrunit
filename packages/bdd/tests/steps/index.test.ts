import { describe, expect, it, vi } from 'vitest';

describe('steps/index side effects', () => {
  it('registers built-in step definitions when imported', async () => {
    vi.resetModules();

    const { createRegistry } = await import('../../src/registry');
    const before = createRegistry().definitions.length;

    const { registry } = await import('../../src/registry');
    const initial = registry.definitions.length;

    await import('../../src/steps/index');
    const after = registry.definitions.length;

    expect(after).toBeGreaterThan(initial);
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
