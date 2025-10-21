import { defineParameterType } from './dsl';
import { locatorParameter, valueParameter, booleanParameter } from '@letsrunit/gherkin';

defineParameterType(locatorParameter());
defineParameterType(valueParameter());

defineParameterType(booleanParameter('visible', 'hidden'));
defineParameterType(booleanParameter('enabled', 'disabled', /(en|dis)abled/));
defineParameterType(booleanParameter('checked', 'unchecked', /(un)?checked/));
defineParameterType(booleanParameter('contain', 'not contain', /(not )?contain/));
