import { describe, expect, it } from 'vitest';
import { executableScenarioIds } from '../src/executable-scenarios';
import { scenarioIdFromGherkin } from '../src/scenario-id';

describe('executableScenarioIds', () => {
  it('includes a plain scenario id', () => {
    const source = `
Feature: Login

  Scenario: User logs in
    Given I am on "/login"
    When I click button "Login"
`;
    const ids = executableScenarioIds(source);
    const expected = scenarioIdFromGherkin('Scenario:\n  Given I am on "/login"\n  When I click button "Login"');
    expect(ids.has(expected)).toBe(true);
  });

  it('keeps id stable when scenario becomes outline with same row values', () => {
    const plain = `
Feature: Auth

  Scenario: Login
    Given user "alice" exists
    When I login as "alice"
`;
    const outline = `
Feature: Auth

  Scenario Outline: Login
    Given user "<name>" exists
    When I login as "<name>"

    Examples:
      | name  |
      | alice |
`;
    const plainId = [...executableScenarioIds(plain)][0];
    const outlineId = [...executableScenarioIds(outline)][0];
    expect(outlineId).toBe(plainId);
  });

  it('includes outline rows as executable scenarios', () => {
    const source = `
Feature: Auth

  Scenario Outline: Login
    Given user "<name>" exists
    When I login as "<name>"

    Examples:
      | name |
      | a    |
      | b    |
`;
    expect(executableScenarioIds(source).size).toBe(2);
  });
});
