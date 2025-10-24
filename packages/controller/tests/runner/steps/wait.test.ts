import { describe, it, expect, afterAll, vi } from 'vitest';
import { runner } from '../../../src/runner';
import '../../../src/runner/parameters';
import '../../../src/runner/steps/wait';

type WaitForArgs = { state: string; timeout: number };

describe('steps/wait (runner)', () => {
  afterAll(() => runner.reset());

  it('waits for element to be visible or hidden with timeout 5000', async () => {
    const waitFor = vi.fn();
    const el = { waitFor } as unknown as { waitFor: (args: WaitForArgs) => Promise<void> };
    const page = { locator: vi.fn().mockReturnValue(el) } as any;

    const feature = `
      Feature: Wait
        Scenario: visible and hidden
          When I wait for #thing to be visible
          And I wait for \`.item\` to be hidden
    `;

    await runner.run(feature, { page } as any);

    expect(page.locator).toHaveBeenCalledWith('#thing');
    expect(waitFor).toHaveBeenCalledWith({ state: 'visible', timeout: 5000 });
    expect(page.locator).toHaveBeenCalledWith('.item');
    expect(waitFor).toHaveBeenLastCalledWith({ state: 'hidden', timeout: 5000 });
  });

  it('waits for child attachment or detachment with timeout 5000', async () => {
    const childWaitFor = vi.fn();
    const childLocator = { waitFor: childWaitFor } as any;
    const parentLocator = { locator: vi.fn().mockReturnValue(childLocator) } as any;
    const page = { locator: vi.fn().mockReturnValue(parentLocator) } as any;

    const feature = `
      Feature: Wait child
        Scenario: contain and not contain
          When I wait for #list to contain li
          And I wait for \`.cards\` to not contain \`.card\`
    `;

    await runner.run(feature, { page } as any);

    expect(page.locator).toHaveBeenCalledWith('#list');
    expect(parentLocator.locator).toHaveBeenCalledWith('li');
    expect(childWaitFor).toHaveBeenCalledWith({ state: 'attached', timeout: 5000 });

    expect(page.locator).toHaveBeenCalledWith('.cards');
    expect(parentLocator.locator).toHaveBeenCalledWith('.card');
    expect(childWaitFor).toHaveBeenLastCalledWith({ state: 'detached', timeout: 5000 });
  });
});
