import { compileLocator, locatorRegexp } from './locator';
import { KeyCombo, parseKeyCombo } from './keys/parse-key-combo';

export interface ParameterTypeDefinition<T> {
  name: string;
  regexp: readonly RegExp[] | readonly string[] | RegExp | string;
  transformer?: (...match: string[]) => T;
  useForSnippets?: boolean;
  preferForRegexpMatch?: boolean;
}

function enumToRegexp(values: readonly string[]) {
  const satinized = values.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(${satinized.join('|')})`);
}

export function booleanParameter(trueValue: string, falseValue: string, regexp?: RegExp): ParameterTypeDefinition<boolean> {
  return {
    name: trueValue.replace(/\W/, '_'),
    regexp: regexp ?? enumToRegexp([trueValue, falseValue]),
    transformer: (value: string): boolean => value === trueValue,
  };
}

export function enumParameter<const T extends readonly string[]>(values: T, regexp?: RegExp): ParameterTypeDefinition<T[number]> {
  return {
    name: values[0].replace(/\W/, '_'),
    regexp: regexp ?? enumToRegexp(values),
    transformer: (value: string): string => value,
  };
}

export function valueParameter(name = 'value'): ParameterTypeDefinition<string | number> {
  return {
    name,
    regexp: /"((?:[^"\\]+|\\.)*)"|(-?\d+(?:\.\d+)?)/,
    transformer: (str?: string, num?: string): string | number => {
      if (str != null) return str;
      if (num != null) return Number(num);
      throw new Error('Unexpected value');
    },
  };
}

export function locatorParameter(name = 'locator'): ParameterTypeDefinition<string> {
  return {
    name,
    regexp: locatorRegexp,
    transformer: (locator: string) => {
      try {
        return compileLocator(locator);
      } catch (e) {
        console.error(e);
        return locator;
      }
    },
  };
}

export function keysParameter(name = 'keys'): ParameterTypeDefinition<KeyCombo> {
  return {
    name,
    regexp: /"([^"]+)"|'([^']+)'/,
    transformer: (doubleQuoted?: string, singleQuoted?: string): KeyCombo => {
      const raw = (doubleQuoted ?? singleQuoted ?? '').trim();
      return parseKeyCombo(raw);
    },
  };
}
