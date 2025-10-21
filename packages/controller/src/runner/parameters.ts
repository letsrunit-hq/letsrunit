import { defineParameterType } from './dsl';
import { locatorParameter, valueParameter, booleanParameter } from '@letsrunit/gherkin';

defineParameterType(locatorParameter());
defineParameterType(valueParameter());

defineParameterType(booleanParameter('visible', 'hidden'));
defineParameterType(booleanParameter('enabled', 'disabled', /(en|dis)abled/i));
defineParameterType(booleanParameter('checked', 'unchecked', /(un)?checked/i));
defineParameterType(booleanParameter('contain', 'not contain', /(not )?contain/i));
