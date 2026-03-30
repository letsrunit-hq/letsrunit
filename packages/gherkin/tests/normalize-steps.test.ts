import { describe, expect, it } from 'vitest';
import { normalizeSteps } from '../src/normalize-steps';

describe('normalizeSteps', () => {
  it('normalizes a sequence and carries keyword for And/But/*', () => {
    const result = normalizeSteps([
      { keyword: 'Given', text: 'I am signed out' },
      { keyword: 'And', text: 'I open the login page' },
      { keyword: 'When', text: 'I submit valid credentials' },
      { keyword: 'But', text: 'I have no 2FA enabled' },
      { keyword: '*', text: 'I should reach the dashboard' },
    ]);

    expect(result).toEqual([
      'Given I am signed out',
      'Given I open the login page',
      'When I submit valid credentials',
      'When I have no 2FA enabled',
      'When I should reach the dashboard',
    ]);
  });

  it('normalizes doc strings and data tables', () => {
    const result = normalizeSteps([
      {
        keyword: 'Given',
        text: 'I send payload',
        docString: { content: ' { "a": 1 } ' },
      },
      {
        keyword: 'Then',
        text: 'I see users',
        dataTable: {
          rows: [
            { cells: [{ value: ' name ' }, { value: ' role ' }] },
            { cells: [{ value: ' alice ' }, { value: ' admin ' }] },
          ],
        },
      },
    ]);

    expect(result[0]).toBe('Given I send payload\n"""\n{ "a": 1 }\n"""');
    expect(result[1]).toBe('Then I see users\n| name | role |\n| alice | admin |');
  });
});
