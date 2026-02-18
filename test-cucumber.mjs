import { CucumberExpression, ParameterType, ParameterTypeRegistry } from '@cucumber/cucumber-expressions';

const scalarRegexp =
  /"((?:[^"\\]+|\\.)*)"|(-?\d+(?:\.\d+)?)|date (?:of )?((?:today|tomorrow|yesterday|\d+ \w+ (?:ago|from now))(?: (?:at )?\d\d?:\d\d?(?::\d\d?)?)?|"\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:.\d{3})?Z?)?")/;
const arrayRegexp = /\[(.*?)\]/;
const SELECTOR = /(?:the )?\w+(?: "[^"]*")?|`([^`]+|\\.)*`/;
const locatorRegexp = new RegExp(String.raw`((?:${SELECTOR.source})(?: with(?:in|out)? (?:${SELECTOR.source}))*)`);

const registry = new ParameterTypeRegistry();
registry.defineParameterType(new ParameterType('locator', locatorRegexp, null, (l) => l, true));
registry.defineParameterType(new ParameterType('value', [scalarRegexp, arrayRegexp], null, (...args) => args, true));

const expr = new CucumberExpression('I set {locator} to {value}', registry);

const tests = [
  'I set "#dob" to "John"',
  'I set "#dob" to 42',
  'I set "#dob" to date of tomorrow',
  'I set "#dob" to date tomorrow',
  'I set "#dob" to date 2 days ago'
];

for (const test of tests) {
  const match = expr.match(test);
  if (match) {
    console.log(`PASS: ${test}`);
    console.log(`  locator: ${match[0].getValue(null)}`);
    console.log(`  value: ${JSON.stringify(match[1].getValue(null))}`);
  } else {
    console.log(`FAIL: ${test}`);
  }
}

