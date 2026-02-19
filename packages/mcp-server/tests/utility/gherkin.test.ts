import { describe, expect, it } from 'vitest';
import { normalizeGherkin } from '../../src/utility/gherkin';

describe('normalizeGherkin', () => {
  it('passes through a Feature block unchanged', () => {
    const input = 'Feature: Login\n\nScenario: Happy path\n  Given I am on "/"';
    expect(normalizeGherkin(input)).toBe(input);
  });

  it('passes through a Scenario block unchanged', () => {
    const input = 'Scenario: Steps\n  Given I am on "/"';
    expect(normalizeGherkin(input)).toBe(input);
  });

  it('passes through a Background block unchanged', () => {
    const input = 'Background:\n  Given I am logged in';
    expect(normalizeGherkin(input)).toBe(input);
  });

  it('wraps a bare step line in a Feature + Scenario', () => {
    const result = normalizeGherkin('Given I am on "/"');
    expect(result).toContain('Feature: MCP');
    expect(result).toContain('Scenario: Steps');
    expect(result).toContain('Given I am on "/"');
  });

  it('indents multiple bare steps', () => {
    const result = normalizeGherkin('Given I am on "/"\nWhen I click "Submit"');
    expect(result).toContain('  Given I am on "/"');
    expect(result).toContain('  When I click "Submit"');
  });

  it('trims leading and trailing whitespace before wrapping', () => {
    const result = normalizeGherkin('  Given I am on "/"  ');
    expect(result).toContain('Given I am on "/"');
  });

  it('is case-insensitive for Feature/Scenario detection', () => {
    expect(normalizeGherkin('feature: something')).toContain('feature: something');
    expect(normalizeGherkin('scenario: something')).toContain('scenario: something');
  });
});
