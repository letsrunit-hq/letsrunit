import { describe, expect, it } from 'vitest';
import { normalizeStep } from '../src/normalize-step';

describe('normalizeStep', () => {
  it('combines keyword and text', () => {
    expect(normalizeStep('Given', 'I am on the homepage')).toBe('Given I am on the homepage');
  });

  it('trims whitespace from keyword and text', () => {
    expect(normalizeStep('When ', '  I click the button  ')).toBe('When I click the button');
  });

  it('appends doc string', () => {
    const result = normalizeStep('Given', 'I send the payload', { content: '{"key": "value"}' });
    expect(result).toBe('Given I send the payload\n"""\n{"key": "value"}\n"""');
  });

  it('trims doc string content', () => {
    const result = normalizeStep('Given', 'I send the payload', { content: '  hello  ' });
    expect(result).toBe('Given I send the payload\n"""\nhello\n"""');
  });

  it('appends data table', () => {
    const dataTable = {
      rows: [
        { cells: [{ value: 'name' }, { value: 'age' }] },
        { cells: [{ value: 'Alice' }, { value: '30' }] },
      ],
    };
    const result = normalizeStep('Given', 'I have the users', undefined, dataTable);
    expect(result).toBe('Given I have the users\n| name | age |\n| Alice | 30 |');
  });

  it('trims data table cell values', () => {
    const dataTable = {
      rows: [{ cells: [{ value: ' foo ' }, { value: ' bar ' }] }],
    };
    const result = normalizeStep('Then', 'I see', undefined, dataTable);
    expect(result).toBe('Then I see\n| foo | bar |');
  });

  it('ignores empty docString content', () => {
    const result = normalizeStep('Given', 'I do something', { content: '' });
    expect(result).toBe('Given I do something');
  });

  it('ignores empty data table', () => {
    const result = normalizeStep('Given', 'I do something', undefined, { rows: [] });
    expect(result).toBe('Given I do something');
  });
});
