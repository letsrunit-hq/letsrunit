import { defineParameterType } from './dsl';
import { locatorParameter, valueParameter, booleanParameter, enumParameter, keysParameter } from '@letsrunit/gherkin';

defineParameterType(locatorParameter());
defineParameterType(valueParameter());
defineParameterType(keysParameter());

defineParameterType(booleanParameter('visible', 'hidden'));
defineParameterType(booleanParameter('enabled', 'disabled', /((?:en|dis)abled)/));
defineParameterType(booleanParameter('checked', 'unchecked', /((?:un)?checked)/));
defineParameterType(booleanParameter('contains', 'not contains', /((?:not )?contains)/));

defineParameterType(booleanParameter('check', 'uncheck', /((?:un)?check)/));
defineParameterType(booleanParameter('focus', 'blur'));

defineParameterType(enumParameter(['click', 'double-click', 'right-click', 'hover'], /((?:double-|right-)?click|hover)/));
