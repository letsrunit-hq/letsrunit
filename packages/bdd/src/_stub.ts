// Generated for IDE indexing (WebStorm), never executed.
import { defineParameterType } from '@cucumber/cucumber';

defineParameterType({ name: 'locator', regexp: /((?:(?:the )?\w+(?: "[^"]*")?|`([^`]+|\\.)*`)(?: with(?:in|out)? (?:(?:the )?\w+(?: "[^"]*")?|`([^`]+|\\.)*`))*)/, transformer: (s: string) => s });
defineParameterType({ name: 'value', regexp: /"((?:[^"\\]+|\\.)*)"|(-?\d+(?:\.\d+)?)|date (?:of )?((?:today|tomorrow|yesterday|\d+ \w+ (?:ago|from now))(?: (?:at )?\d\d?:\d\d(?:\d\d)?)?|"((?:[^"\\]+|\\.)*)")/, transformer: (s: string) => s });
defineParameterType({ name: 'keys', regexp: /"([^"]+)"|'([^']+)'/, transformer: (s: string) => s });
defineParameterType({ name: 'visible|hidden', regexp: /(visible|hidden)/, transformer: (s: string) => s });
defineParameterType({ name: 'see|dont see', regexp: /((?:don'?t )?see)/, transformer: (s: string) => s });
defineParameterType({ name: 'enabled|disabled', regexp: /((?:en|dis)abled)/, transformer: (s: string) => s });
defineParameterType({ name: 'checked|unchecked', regexp: /((?:un)?checked)/, transformer: (s: string) => s });
defineParameterType({ name: 'contains|not contains', regexp: /((?:not )?contains)/, transformer: (s: string) => s });
defineParameterType({ name: 'check|uncheck', regexp: /((?:un)?check)/, transformer: (s: string) => s });
defineParameterType({ name: 'focus|blur', regexp: /(focus|blur)/, transformer: (s: string) => s });
defineParameterType({ name: 'click|double-click|right-click|hover', regexp: /((?:double-|right-)?click|hover)/, transformer: (s: string) => s });
