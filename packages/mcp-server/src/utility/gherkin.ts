export function normalizeGherkin(input: string): string {
  const trimmed = input.trim();

  if (/^(Feature|Scenario|Background):/im.test(trimmed)) {
    return trimmed;
  }

  return `Feature: MCP\n\nScenario: Steps\n  ${trimmed.split('\n').join('\n  ')}`;
}
