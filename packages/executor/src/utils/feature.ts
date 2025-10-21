export function feature(description: string, steps: string[]) {
  return [
    `Feature: ${description}`.trim(),
    '',
    '  Scenario:',
    steps.map((s) => `    ${s}`).join('\n'),
  ].join('\n')
}
