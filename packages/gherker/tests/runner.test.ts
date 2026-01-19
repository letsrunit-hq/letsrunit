import { describe, expect, it, vi } from 'vitest';
import { Runner } from '../src';
import { World } from '../src/types';

describe('Runner', () => {
  it('should define a step', () => {
    const runner = new Runner();
    const handler = () => {};
    runner.defineStep('Given', 'I have {int} apples', handler);

    expect(runner.defs).toHaveLength(1);
    expect(runner.defs[0].type).toBe('Given');
    expect(runner.defs[0].source).toBe('I have {int} apples');
    expect(runner.defs[0].fn).toBe(handler);
  });

  it('should define a parameter type', () => {
    const runner = new Runner();
    runner.defineParameterType({
      name: 'color',
      placeholder: 'color',
      regexp: /red|blue|green/,
      transformer: (s) => s,
    });

    // We can check if it's in the registry by trying to define a step using it
    expect(() => {
      runner.defineStep('Given', 'I have a {color} ball', () => {});
    }).not.toThrow();
  });

  it('should parse a feature string', () => {
    const runner = new Runner();
    runner.defineStep('Given', 'I have {int} apples', () => {});
    runner.defineStep('When', 'I eat {int} apples', () => {});

    const feature = `
Feature: Eating apples
  Scenario: Eat some apples
    Given I have 10 apples
    When I eat 3 apples
`;

    const parsed = runner.parse(feature);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].text).toBe('I have 10 apples');
    expect(parsed[0].def).toBe('Given I have {int} apples');
    expect(parsed[0].values).toEqual([10]);
    expect(parsed[1].text).toBe('I eat 3 apples');
    expect(parsed[1].def).toBe('When I eat {int} apples');
    expect(parsed[1].values).toEqual([3]);
  });

  it('should run a successful scenario', async () => {
    const runner = new Runner<{ apples: number } & World>();
    runner.defineStep('Given', 'I have {int} apples', function (n: number) {
      this.apples = n;
    });
    runner.defineStep('When', 'I eat {int} apples', function (n: number) {
      this.apples -= n;
    });
    runner.defineStep('Then', 'I should have {int} apples', function (n: number) {
      expect(this.apples).toBe(n);
    });

    const feature = `
Feature: Eating apples
  Scenario: Eat some apples
    Given I have 10 apples
    When I eat 3 apples
    Then I should have 7 apples
`;

    const result = await runner.run(feature, { apples: 0 });

    expect(result.status).toBe('passed');
    expect(result.steps).toHaveLength(3);
    expect(result.steps.every((s) => s.status === 'success')).toBe(true);
    expect(result.world.apples).toBe(7);
  });

  it('should fail when a step fails', async () => {
    const runner = new Runner<World>();
    runner.defineStep('Given', 'a failing step', () => {
      throw new Error('Step failed');
    });

    const feature = `
Feature: Fails
  Scenario: Fails
    Given a failing step
`;

    const result = await runner.run(feature, {});

    expect(result.status).toBe('failed');
    expect(result.reason?.message).toBe('Step failed');
    expect(result.steps[0].status).toBe('failure');
  });

  it('should catch synchronous errors in steps', async () => {
    const runner = new Runner<World>();
    runner.defineStep('Given', 'a step with sync error', () => {
      throw new Error('Sync error');
    });

    const feature = `
Feature: Sync Error
  Scenario: Sync Error
    Given a step with sync error
`;

    const result = await runner.run(feature, {});
    expect(result.status).toBe('failed');
    expect(result.reason?.message).toBe('Sync error');
  });

  it('should use RegularExpression if expression is RegExp', () => {
    const runner = new Runner();
    const handler = () => {};
    runner.defineStep('Given', /I have (\d+) apples/, handler);

    expect(runner.defs).toHaveLength(1);
    expect(runner.defs[0].source).toBe('/I have (\\d+) apples/');
  });

  it('should fail for undefined step', async () => {
    const runner = new Runner<World>();
    const feature = `
Feature: Undefined
  Scenario: Undefined
    Given an undefined step
`;

    const result = await runner.run(feature, {});

    expect(result.status).toBe('failed');
    expect(result.reason?.message).toContain('Undefined step: an undefined step');
    expect(result.steps[0].status).toBe('failure');
  });

  it('should support DocString', async () => {
    const runner = new Runner<{ content?: string } & World>();
    runner.defineStep('Given', 'a docstring:', function (doc: string) {
      this.content = doc;
    });

    const feature = `
Feature: DocString
  Scenario: DocString
    Given a docstring:
      """
      Hello world
      """
`;

    const result = await runner.run(feature, { content: '' });
    expect(result.status).toBe('passed');
    expect(result.world.content).toBe('Hello world');
  });

  it('should support DataTable', async () => {
    const runner = new Runner<{ data?: string[][] } & World>();
    runner.defineStep('Given', 'a datatable:', function (data: string[][]) {
      this.data = data;
    });

    const feature = `
Feature: DataTable
  Scenario: DataTable
    Given a datatable:
      | name  | age |
      | Alice | 30  |
      | Bob   | 25  |
`;

    const result = await runner.run(feature, { data: [] });
    expect(result.status).toBe('passed');
    expect(result.world.data).toEqual([
      ['name', 'age'],
      ['Alice', '30'],
      ['Bob', '25'],
    ]);
  });

  it('should call cleanup on world', async () => {
    const runner = new Runner<World>();
    const cleanup = vi.fn();
    runner.defineStep('Given', 'a step', () => {});

    const feature = `
Feature: Cleanup
  Scenario: Cleanup
    Given a step
`;

    await runner.run(feature, { cleanup });
    expect(cleanup).toHaveBeenCalled();
  });

  it('should support world factory', async () => {
    const runner = new Runner<{ initialized: boolean } & World>();
    runner.defineStep('Given', 'a step', function () {
      expect(this.initialized).toBe(true);
    });

    const feature = `
Feature: Factory
  Scenario: Factory
    Given a step
`;

    const result = await runner.run(feature, async () => ({ initialized: true }));
    expect(result.status).toBe('passed');
  });

  it('should support wrapRun and handle errors in wrapper', async () => {
    const runner = new Runner<World>();
    runner.defineStep('Given', 'a step', () => {});

    const feature = `
Feature: Wrap Error
  Scenario: Wrap Error
    Given a step
`;

    const wrapper = async (_step: any, _run: any) => {
      throw new Error('Wrapper error');
    };
    const result = await runner.run(feature, {}, wrapper);

    expect(result.status).toBe('failed');
    expect(result.reason?.message).toBe('Wrapper error');
  });

  it('should support wrapRun', async () => {
    const runner = new Runner<World>();
    runner.defineStep('Given', 'a step', () => {});

    const feature = `
Feature: Wrap
  Scenario: Wrap
    Given a step
`;

    const wrapper = vi.fn((step, run) => run());
    await runner.run(feature, {}, wrapper);

    expect(wrapper).toHaveBeenCalled();
    const calledStep = wrapper.mock.calls[0][0];
    expect(calledStep.text).toBe('Given a step');
  });

  it('should support AbortSignal', async () => {
    const runner = new Runner<World>();
    runner.defineStep('Given', 'a step', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const feature = `
Feature: Abort
  Scenario: Abort
    Given a step
    And a step
`;

    const controller = new AbortController();
    const runPromise = runner.run(feature, {}, undefined, { signal: controller.signal });

    controller.abort('Cancelled');

    const result = await runPromise;
    expect(result.status).toBe('failed');
    expect(result.reason?.message).toBe('Cancelled');
  });

  it('should reset definitions and registry', () => {
    const runner = new Runner();
    runner.defineStep('Given', 'a step', () => {});
    runner.defineParameterType({
      name: 'custom',
      placeholder: 'custom',
      regexp: /foo/,
      transformer: (s) => s,
    });

    runner.reset();

    expect(runner.defs).toHaveLength(0);
    // Registry should also be reset (try to use custom param type)
    expect(() => {
      runner.defineStep('Given', 'a {custom}', () => {});
    }).toThrow();
  });

  it('should throw error for multiple scenarios', async () => {
    const runner = new Runner();
    const feature = `
Feature: Multiple
  Scenario: One
    Given a step
  Scenario: Two
    Given a step
`;

    // noinspection ES6RedundantAwait
    await expect(runner.run(feature, {})).rejects.toThrow('Multiple scenarios not supported');
    expect(() => runner.parse(feature)).toThrow('Multiple scenarios not supported');
  });

  it('should handle undefined match.def.type in parse', () => {
    const runner = new Runner();
    // No step definitions
    const feature = `
Feature: Undefined
  Scenario: Undefined
    Given an undefined step
`;
    const parsed = runner.parse(feature);
    expect(parsed[0].def).toBeUndefined();
  });

  it('should throw error if no scenarios found', async () => {
    const runner = new Runner();
    const feature = `Feature: Empty`;

    // noinspection ES6RedundantAwait
    await expect(runner.run(feature, {})).rejects.toThrow('No scenarios found');
  });
});
