import { describe, expect, it } from 'vitest';
import { createRegistry, Given, registry, When, Then } from '../src/registry';

describe('createRegistry', () => {
  it('returns an independent registry instance', () => {
    const a = createRegistry();
    const b = createRegistry();

    a.defineStep('Given', 'step in a', () => {});

    expect(a.defs).toHaveLength(1);
    expect(b.defs).toHaveLength(0);
  });

  it('has built-in parameter types pre-registered (e.g. {string})', () => {
    const reg = createRegistry();
    reg.defineStep('Given', 'value is {string}', () => {});

    const result = reg.match('value is "hello"');
    expect(result).not.toBeNull();
    expect(result!.values).toEqual(['hello']);
  });

  it('has built-in parameter types for {int}', () => {
    const reg = createRegistry();
    reg.defineStep('Then', 'count is {int}', () => {});

    const result = reg.match('count is 42');
    expect(result?.values).toEqual([42]);
  });

  it('defineStep adds to defs with correct type and source', () => {
    const reg = createRegistry();
    const fn = () => {};
    reg.defineStep('When', 'I click {string}', fn);

    expect(reg.defs).toHaveLength(1);
    expect(reg.defs[0].type).toBe('When');
    expect(reg.defs[0].source).toBe('I click {string}');
    expect(reg.defs[0].fn).toBe(fn);
  });

  it('deduplicates by type and expression', () => {
    const reg = createRegistry();
    reg.defineStep('When', 'I click {string}', () => {}, 'first');
    reg.defineStep('When', 'I click {string}', () => {}, 'second');

    expect(reg.defs).toHaveLength(1);
    expect(reg.defs[0].source).toBe('I click {string}');
  });

  it('definitions returns raw step definitions with original expression', () => {
    const reg = createRegistry();
    const expr = /click (\w+)/;
    reg.defineStep('When', expr, () => {});

    expect(reg.definitions[0].expression).toBe(expr);
  });

  it('definitions preserves string expressions', () => {
    const reg = createRegistry();
    reg.defineStep('Given', 'I am logged in', () => {});

    expect(reg.definitions[0].expression).toBe('I am logged in');
  });

  it('match returns null for unknown step', () => {
    const reg = createRegistry();
    expect(reg.match('an undefined step')).toBeNull();
  });

  it('match returns values and args for a matching step', () => {
    const reg = createRegistry();
    const fn = () => {};
    reg.defineStep('Then', 'result is {int}', fn);

    const result = reg.match('result is 5');
    expect(result).not.toBeNull();
    expect(result!.def.fn).toBe(fn);
    expect(result!.values).toEqual([5]);
    expect(result!.args).toHaveLength(1);
  });

  it('defineParameterType registers a custom type', () => {
    const reg = createRegistry();
    reg.defineParameterType({ name: 'direction', placeholder: 'direction', regexp: /left|right/, transformer: (s) => s });
    reg.defineStep('When', 'I go {direction}', () => {});

    const result = reg.match('I go left');
    expect(result?.values).toEqual(['left']);
  });
});

describe('Given / When / Then module-level helpers', () => {
  it('shares global registry across duplicate module instances', async () => {
    const a = await import('../src/registry.ts?probe=a');
    const b = await import('../src/registry.ts?probe=b');
    expect(a.registry).toBe(b.registry);
  });

  it('Given registers into the global registry and returns a StepDefinition', () => {
    const before = registry.defs.length;
    const fn = () => {};
    const def = Given('a custom given step', fn);

    expect(def.type).toBe('Given');
    expect(def.expression).toBe('a custom given step');
    expect(def.fn).toBe(fn);
    expect(registry.defs.length).toBe(before + 1);
  });

  it('When registers into the global registry', () => {
    const before = registry.defs.length;
    When('a custom when step', () => {});
    expect(registry.defs.length).toBe(before + 1);
    expect(registry.defs.at(-1)!.type).toBe('When');
  });

  it('Then registers into the global registry', () => {
    const before = registry.defs.length;
    Then('a custom then step', () => {});
    expect(registry.defs.length).toBe(before + 1);
    expect(registry.defs.at(-1)!.type).toBe('Then');
  });
});
