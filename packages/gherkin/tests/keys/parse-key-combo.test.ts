import { describe, expect, it } from 'vitest';
import { parseKeyCombo } from '../../src/keys/parse-key-combo';

describe('parseKeyCombo', () => {
  it('parses modifier synonyms and normalizes a final single-letter key', () => {
    expect(parseKeyCombo('ctrl + s')).toEqual({ modifiers: ['Control'], key: 'S' });
    expect(parseKeyCombo('command + option + del')).toEqual({ modifiers: ['Meta', 'Alt'], key: 'Delete' });
  });

  it('parses function keys and single-token combos', () => {
    expect(parseKeyCombo('shift + f12')).toEqual({ modifiers: ['Shift'], key: 'F12' });
    expect(parseKeyCombo('ctrl')).toEqual({ modifiers: [], key: 'Control' });
  });

  it('keeps unknown multi-character tokens as-is', () => {
    expect(parseKeyCombo('ctrl + BracketLeft')).toEqual({ modifiers: ['Control'], key: 'BracketLeft' });
  });

  it('throws when non-modifiers appear before the final key', () => {
    expect(() => parseKeyCombo('a + Enter')).toThrow('Only modifiers may precede the final key');
  });

  it('throws for empty combos after trimming separators', () => {
    expect(() => parseKeyCombo(' +   + ')).toThrow('Invalid key combo');
  });
});
