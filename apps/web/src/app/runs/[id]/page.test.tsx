import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../actions/journal', () => ({
  getJournal: vi.fn(async () => ({ entries: [] })),
}));

import Page from './page';

describe('run page', () => {
  it('renders journal', async () => {
    const ui = await Page({ params: { id: 'test-run' } } as any);
    render(ui as any);
    // Journal renders an empty list container
    expect(screen.getByLabelText('journal-entries')).toBeInTheDocument();
  });
});
