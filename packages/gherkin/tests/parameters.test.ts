import { CucumberExpression, ParameterType, ParameterTypeRegistry } from '@cucumber/cucumber-expressions';
import { formatDateForInput } from '@letsrunit/playwright';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  booleanParameter,
  enumParameter,
  keysParameter,
  locatorParameter,
  ParameterTypeDefinition,
  valueParameter,
} from '../src';

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

  beforeAll(() => {
    param = valueParameter();
    reg = new ParameterTypeRegistry();
    defineParameterType(reg, param);
    expr = new CucumberExpression('value is {value}', reg);
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
    const value = d.getValue(null);
    expect(value).to.be.instanceOf(Date);
    expect(formatDateForInput(value as Date, 'datetime-local')).to.eq('1981-08-22T00:00');
  });

  it('parses a date/time string value', () => {
    const [d] = expr.match('value is date "1981-08-22T15:04"')!;
    const value = d.getValue(null);
    expect(value).to.be.instanceOf(Date);
    expect(formatDateForInput(value as Date, 'datetime-local')).to.eq('1981-08-22T15:04');
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
    expect(formatDateForInput(val[1] as Date, 'datetime-local')).to.eq('1981-08-22T15:04');
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
