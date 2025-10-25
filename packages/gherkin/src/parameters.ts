import { ParameterType } from '@cucumber/cucumber-expressions';
import { compileLocator } from './locator';
import { KeyCombo, parseKeyCombo } from './keys/parse-key-combo';

function enumToRegexp(values: readonly string[]) {
  return new RegExp(values.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));
}

export function booleanParameter(trueValue: string, falseValue: string, regexp?: RegExp): ParameterType<boolean> {
  const param = new ParameterType<boolean>(
    undefined,
    regexp ?? enumToRegexp([trueValue, falseValue]),
    Boolean,
    (value: string): boolean => value === trueValue,
    true
  );

  (param as any).name = [trueValue, falseValue].join('|'); // The `|` is not allowed in the name, but we really want to use it.

  return param;
}

export function enumParameter<const T extends readonly string[]>(values: T, regexp?: RegExp): ParameterType<T[number]> {
  const param = new ParameterType<string>(
    undefined,
    regexp ?? enumToRegexp(values),
    String,
    (value: string): string => value,
    true
  );

  (param as any).name = values.join('|'); // The `|` is not allowed in the name, but we really want to use it.

  return param;
}

export function valueParameter(name = 'value'): ParameterType<string | number> {
  return new ParameterType<string | number>(
    name,
    /"((?:[^"\\]+|\\.)*)"|(-?\d+(?:\.\d+)?)/,
    null,
    (str?: string, num?: string): string | number => {
      if (str != null) return str;
      if (num != null) return Number(num);
      throw new Error("Unexpected value");
    },
    false
  );
}

export function locatorParameter(name = 'locator'): ParameterType<string> {
  return new ParameterType<string>(
    name,
    /(.+)/,
    String,
    (locator: string) => compileLocator(locator),
    false,
  );
}

export function keysParameter(name = 'keys'): ParameterType<KeyCombo> {
  return new ParameterType<KeyCombo>(
    name,
    // Use a function to extract either double-quoted or single-quoted content.
    /"([^"]+)"|'([^']+)'/,
    null,
    (doubleQuoted?: string, singleQuoted?: string): KeyCombo => {
      const raw = (doubleQuoted ?? singleQuoted ?? '').trim();
      return parseKeyCombo(raw);
    },
    false,
  );
}
