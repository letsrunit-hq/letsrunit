import { CucumberExpression, ParameterType, ParameterTypeRegistry } from '@cucumber/cucumber-expressions';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  booleanParameter,
  enumParameter,
  keysParameter,
  locatorParameter,
  ParameterTypeDefinition,
  valueParameter,
} from '../src';

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defineParameterType(reg: ParameterTypeRegistry, type: ParameterTypeDefinition<unknown>): void {
  const param = new ParameterType(type.name, type.regexp, null, type.transformer, type.useForSnippets);
  reg.defineParameterType(param);
}

describe('booleanParameter', () => {
  let param: ParameterTypeDefinition<boolean>;
  let reg: ParameterTypeRegistry;
  let expr: CucumberExpression;

  beforeAll(() => {
    param = booleanParameter('visible', 'hidden');
    reg = new ParameterTypeRegistry();
    defineParameterType(reg, param);
    expr = new CucumberExpression('it is {visible}', reg);
  });

  it('creates a boolean parameter type', () => {
    expect(param.name).to.eq('visible');
  });

  it('match true value', () => {
    const [visible] = expr.match('it is visible')!;
    expect(visible.getParameterType().name).to.eq('visible');
    expect(visible.getValue(null)).to.eq(true);
  });

  it('match false value', () => {
    const [hidden] = expr.match('it is hidden')!;
    expect(hidden.getParameterType().name).to.eq('visible');
    expect(hidden.getValue(null)).to.eq(false);
  });
});

describe('enumParameter', () => {
  let param: ParameterTypeDefinition<string>;
  let reg: ParameterTypeRegistry;
  let expr: CucumberExpression;

  beforeAll(() => {
    const vals = ['left', 'right', 'center'] as const;
    param = enumParameter(vals);
    reg = new ParameterTypeRegistry();
    defineParameterType(reg, param);
    expr = new CucumberExpression('align {left}', reg);
  });

  it('creates an enum parameter type with a joined name', () => {
    expect(param.name).to.eq('left');
  });

  it('matches allowed values and returns the raw string', () => {
    const [left] = expr.match('align left')!;
    expect(left.getParameterType().name).to.eq('left');
    expect(left.getValue(null)).to.eq('left');

    const [center] = expr.match('align center')!;
    expect(center.getValue(null)).to.eq('center');
  });
});

describe('valueParameter', () => {
  let param: ParameterTypeDefinition<unknown>;
  let reg: ParameterTypeRegistry;
  let expr: CucumberExpression;
  let originalPasswordSeed: string | undefined;

  beforeAll(() => {
    param = valueParameter();
    reg = new ParameterTypeRegistry();
    defineParameterType(reg, param);
    expr = new CucumberExpression('value is {value}', reg);
  });

  beforeEach(() => {
    originalPasswordSeed = process.env.LETSRUNIT_PASSWORD_SEED;
  });

  afterEach(() => {
    if (originalPasswordSeed === undefined) {
      delete process.env.LETSRUNIT_PASSWORD_SEED;
      return;
    }

    process.env.LETSRUNIT_PASSWORD_SEED = originalPasswordSeed;
  });

  it('parses a quoted string value', () => {
    const [v] = expr.match('value is "Hello \\"world\\""')!;
    expect(v.getParameterType().name).to.eq('value');
    expect(v.getValue(null)).to.eq('Hello \\"world\\"');
  });

  it('parses a number (int and float, including negative)', () => {
    const [n1] = expr.match('value is 42')!;
    expect(n1.getValue(null)).to.eq(42);
    const [n2] = expr.match('value is -12.5')!;
    expect(n2.getValue(null)).to.eq(-12.5);
  });

  it('parses a relative date value', () => {
    const [d] = expr.match('value is date today')!;
    expect(d.getValue(null)).to.be.instanceOf(Date);
  });

  it('parses a relative date/time value', () => {
    const [d] = expr.match('value is date tomorrow at 15:04')!;
    expect(d.getValue(null)).to.be.instanceOf(Date);
  });

  it('parses a date string value', () => {
    const [d] = expr.match('value is date "1981-08-22"')!;
    const value = d.getValue(null) as Date;
    expect(value).to.be.instanceOf(Date);

    const pad = (n: number) => String(n).padStart(2, '0');
    const expected = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
    expect(formatDateTimeLocal(value)).to.eq(expected);
  });

  it('parses a date/time string value', () => {
    const [d] = expr.match('value is date "1981-08-22T15:04"')!;
    const value = d.getValue(null);
    expect(value).to.be.instanceOf(Date);
    expect(formatDateTimeLocal(value as Date)).to.eq('1981-08-22T15:04');
  });

  it('parses a password value deterministically', () => {
    process.env.LETSRUNIT_PASSWORD_SEED = 'test-seed';

    const [a] = expr.match('value is password of "user-1"')!;
    const [b] = expr.match('value is password of "user-1"')!;
    const [c] = expr.match('value is password of "user-2"')!;

    const valueA = a.getValue(null);
    const valueB = b.getValue(null);
    const valueC = c.getValue(null);

    expect(valueA).to.eq(valueB);
    expect(valueA).not.to.eq(valueC);
    expect(valueA).to.match(/^Lr![a-f0-9]{18}a1$/);
  });

  it('throws when password value is used without LETSRUNIT_PASSWORD_SEED', () => {
    delete process.env.LETSRUNIT_PASSWORD_SEED;

    const [v] = expr.match('value is password of "user-1"')!;
    expect(() => v.getValue(null)).toThrow('LETSRUNIT_PASSWORD_SEED is required');
  });

  it('parses an array of values', () => {
    const res = expr.match('value is ["foo", 42]');
    expect(res).not.to.be.null;

    const [v] = res!;
    const val = v.getValue(null) as any[];
    expect(val).to.have.length(2);
    expect(val[0]).to.eq('foo');
    expect(val[1]).to.eq(42);
  });

  it('parses an array of dates', () => {
    const res = expr.match('value is [date of today, date "1981-08-22T15:04"]');
    expect(res).not.to.be.null;

    const [v] = res!;
    const val = v.getValue(null) as any[];
    expect(val).to.have.length(2);
    expect(val[0]).to.be.instanceOf(Date);
    expect(val[1]).to.be.instanceOf(Date);
    expect(formatDateTimeLocal(val[1] as Date)).to.eq('1981-08-22T15:04');
  });

  it('parses an array containing password values', () => {
    process.env.LETSRUNIT_PASSWORD_SEED = 'test-seed';

    const res = expr.match('value is [password of "user-1", "fallback"]');
    expect(res).not.to.be.null;

    const [v] = res!;
    const val = v.getValue(null) as any[];
    expect(val).to.have.length(2);
    expect(val[0]).to.match(/^Lr![a-f0-9]{18}a1$/);
    expect(val[1]).to.eq('fallback');
  });
});

describe('locatorParameter', () => {
  let param: ParameterTypeDefinition<string>;
  let reg: ParameterTypeRegistry;
  let expr: CucumberExpression;

  beforeAll(() => {
    param = locatorParameter();
    reg = new ParameterTypeRegistry();
    defineParameterType(reg, param);
    expr = new CucumberExpression('{locator}', reg);
  });

  it('compiles a DSL locator into a Playwright selector', () => {
    const [arg] = expr.match('button "Submit"')!;
    expect(arg.getParameterType().name).to.eq('locator');
    expect(arg.getValue(null)).to.eq('role=button [name="Submit"i]');
  });

  it('compiles iframe-scoped locators using enter-frame', () => {
    const [arg] = expr.match('button "Submit" within iframe "ownable widget"')!;
    expect(arg.getValue(null)).to.eq(
      'css=iframe:is([title="ownable widget" i],[name="ownable widget" i],[aria-label="ownable widget" i],[id="ownable widget" i]) >> internal:control=enter-frame >> role=button [name="Submit"i]',
    );
  });

  it('returns the raw locator when compile fails', () => {
    const param = locatorParameter();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(param.transformer?.('button "Submit')).to.eq('button "Submit');
    expect(errorSpy).toHaveBeenCalledOnce();

    errorSpy.mockRestore();
  });
});

describe('keysParameter', () => {
  let param: ParameterTypeDefinition<unknown>;
  let reg: ParameterTypeRegistry;
  let expr: CucumberExpression;

  beforeAll(() => {
    param = keysParameter();
    reg = new ParameterTypeRegistry();
    defineParameterType(reg, param);
    expr = new CucumberExpression('press {keys}', reg);
  });

  it('parses a simple key like "Enter"', () => {
    const [arg] = expr.match('press "Enter"')!;
    const v = arg.getValue(null);
    expect(v).to.deep.eq({ modifiers: [], key: 'Enter' });
  });

  it('parses double-quoted combos like "Ctrl + S"', () => {
    const [arg] = expr.match('press "Ctrl + S"')!;
    const v = arg.getValue(null);
    expect(v).to.deep.eq({ modifiers: ['Control'], key: 'S' });
  });

  it("parses single-quoted combos like 'Shift + ArrowUp'", () => {
    const [arg] = expr.match("press 'Shift + ArrowUp'")!;
    const v = arg.getValue(null);
    expect(v).to.deep.eq({ modifiers: ['Shift'], key: 'ArrowUp' });
  });
});

describe('valueTransformer guard', () => {
  it('throws on unexpected empty value input', () => {
    const param = valueParameter();
    expect(() => param.transformer?.(undefined, undefined, undefined)).toThrow('Unexpected value');
  });
});
