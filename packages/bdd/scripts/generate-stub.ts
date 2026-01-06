import { writeFileSync } from 'node:fs';
import { typeDefinitions } from '../src';

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function serializeRegexp(re: unknown): string {
  if (re instanceof RegExp) return re.toString();
  return '/.+/';
}

const ideLines: string[] = [];
ideLines.push(
  '// Generated for IDE indexing (WebStorm), never executed.',
  "import { defineParameterType } from '@cucumber/cucumber';",
  '',
);

for (const t of typeDefinitions) {
  const name = t.placeholder;
  const regexp = serializeRegexp(t.regexp);
  ideLines.push(`defineParameterType({ name: '${esc(name)}', regexp: ${regexp}, transformer: (s: string) => s });`);
}

ideLines.push('');

const file = ideLines.join('\n');

writeFileSync(__dirname + '/../src/_stub.ts', file, 'utf8');
