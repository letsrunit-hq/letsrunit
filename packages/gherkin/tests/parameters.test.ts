import { describe, expect, it } from 'vitest';
import { booleanParameter, enumParameter, keysParameter, locatorParameter, valueParameter } from '../src';
import { CucumberExpression, ParameterTypeRegistry } from '@cucumber/cucumber-expressions';

describe('booleanParameter', () => {
  const param = booleanParameter('visible', 'hidden');
  const reg = new ParameterTypeRegistry();
  reg.defineParameterType(param);

  const expr = new CucumberExpression('it is {visible|hidden}', reg);

  it('creates a boolean parameter type', () => {
    expect(param.name).to.eq('visible|hidden');
  });

  it('match true value', () => {
    const [visible] = expr.match('it is visible');
    expect(visible.getParameterType().name).to.eq('visible|hidden');
    expect(visible.getValue(null)).to.eq(true);
  });

  it('match false value', () => {
    const [hidden] = expr.match('it is hidden');
    expect(hidden.getParameterType().name).to.eq('visible|hidden');
    expect(hidden.getValue(null)).to.eq(false);
  });
});

describe('enumParameter', () => {
  const vals = ['left', 'right', 'center'] as const;
  const param = enumParameter(vals);
  const reg = new ParameterTypeRegistry();
  reg.defineParameterType(param);

  const expr = new CucumberExpression('align {left|right|center}', reg);

  it('creates an enum parameter type with a joined name', () => {
    expect(param.name).to.eq('left|right|center');
  });

  it('matches allowed values and returns the raw string', () => {
    const [left] = expr.match('align left');
    expect(left.getParameterType().name).to.eq('left|right|center');
    expect(left.getValue(null)).to.eq('left');

    const [center] = expr.match('align center');
    expect(center.getValue(null)).to.eq('center');
  });
});

describe('valueParameter', () => {
  const param = valueParameter();
  const reg = new ParameterTypeRegistry();
  reg.defineParameterType(param);

  const expr = new CucumberExpression('value is {value}', reg);

  it('parses a quoted string value', () => {
    const [v] = expr.match('value is "Hello \\"world\\""');
    expect(v.getParameterType().name).to.eq('value');
    expect(v.getValue(null)).to.eq('Hello \\"world\\"');
  });

  it('parses a number (int and float, including negative)', () => {
    const [n1] = expr.match('value is 42');
    expect(n1.getValue(null)).to.eq(42);
    const [n2] = expr.match('value is -12.5');
    expect(n2.getValue(null)).to.eq(-12.5);
  });
});

describe('locatorParameter', () => {
  const param = locatorParameter();
  const reg = new ParameterTypeRegistry();
  reg.defineParameterType(param);

  const expr = new CucumberExpression('{locator}', reg);

  it('compiles a DSL locator into a Playwright selector', () => {
    const [arg] = expr.match('button "Submit"');
    expect(arg.getParameterType().name).to.eq('locator');
    expect(arg.getValue(null)).to.eq('internal:role=button [name="Submit"i]');
  });
});

describe('keysParameter', () => {
  const param = keysParameter();
  const reg = new ParameterTypeRegistry();
  reg.defineParameterType(param);

  const expr = new CucumberExpression('press {keys}', reg);

  it('parses a simple key like "Enter"', () => {
    const [arg] = expr.match('press "Enter"');
    const v = arg.getValue(null);
    expect(v).to.deep.eq({ modifiers: [], key: 'Enter' });
  });

  it('parses double-quoted combos like "Ctrl + S"', () => {
    const [arg] = expr.match('press "Ctrl + S"');
    const v = arg.getValue(null);
    expect(v).to.deep.eq({ modifiers: ['Control'], key: 'S' });
  });

  it("parses single-quoted combos like 'Shift + ArrowUp'", () => {
    const [arg] = expr.match("press 'Shift + ArrowUp'");
    const v = arg.getValue(null);
    expect(v).to.deep.eq({ modifiers: ['Shift'], key: 'ArrowUp' });
  });
});
