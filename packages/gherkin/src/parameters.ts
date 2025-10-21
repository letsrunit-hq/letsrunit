import { ParameterType } from '@cucumber/cucumber-expressions';
import { compileLocator } from './locator';

export function booleanParameter(trueValue: string, falseValue: string, regexp?: RegExp): ParameterType<boolean> {
  return new ParameterType<boolean>(
    `${trueValue}${falseValue}`,
    regexp ?? new RegExp(`${trueValue}|${falseValue}`),
    Boolean,
    (value: string): boolean => value === trueValue,
    true
  )
}

export function valueParameter(name = 'value'): ParameterType<string | number> {
  return new ParameterType<string | number>(
    name,
    /"((?:[^"\\]+|\\.)*)"|-?\d+(?:\.\d+)?/,
    null,
    (value: string, str: string): string | number => {
      if (str) return str;
      if (!isNaN(Number(value))) return Number(value);
      throw new Error("Unexpected value");
    },
    false
  );
}

export function locatorParameter(name = 'locator'): ParameterType<string> {
  return new ParameterType<string>(
    name,
    /(\w+)(?: +"(?:[^"\\]+|\\.)*"| +\/(?:[^\/\\]+|\\.)*\/| *#[\w-]+)?|`.+`(?: +with(?:out|in)? +(\w+)(?: +"(?:[^"\\]+|\\.)*"| +\/(?:[^\/\\]+|\\.)*\/| *#[\w-]+)?|`.+`)*/,
    String,
    (locator: string) => compileLocator(locator),
    false,
  );
}
