import { describe, expect, it } from 'vitest';

import { statusSymbol } from '../src/status-symbol';

describe('statusSymbol', () => {
  it('returns check mark for success', () => {
    expect(statusSymbol('success')).toBe('✓');
  });

  it('returns cross mark for failure', () => {
    expect(statusSymbol('failure')).toBe('✘');
  });

  it('returns circle for undefined or unknown status', () => {
    expect(statusSymbol()).toBe('○');
    expect(statusSymbol('other')).toBe('○');
  });
});
