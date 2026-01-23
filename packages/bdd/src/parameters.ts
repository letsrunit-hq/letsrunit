import { booleanParameter, enumParameter, keysParameter, locatorParameter, valueParameter } from '@letsrunit/gherkin';

export const typeDefinitions = [
  locatorParameter(),
  valueParameter(),
  keysParameter(),

  booleanParameter('visible', 'hidden'),
  booleanParameter('enabled', 'disabled', /((?:en|dis)abled)/),
  booleanParameter('checked', 'unchecked', /((?:un)?checked)/),
  booleanParameter('contains', 'not contains', /((?:not )?contains)/),

  booleanParameter('check', 'uncheck', /((?:un)?check)/),
  booleanParameter('focus', 'blur'),

  enumParameter(['click', 'double-click', 'right-click', 'hover'], /((?:double-|right-)?click|hover)/),
];
