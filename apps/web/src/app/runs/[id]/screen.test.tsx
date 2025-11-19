import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Screen from './screen';

vi.mock('../../../actions/journal', () => ({
  getJournal: vi.fn(async () => ({ entries: [] })),
}));

describe('run page', () => {
  it('renders journal', async () => {
    const ui = Screen({ projectId: '1' as any, runId: '2' as any });
    render(ui as any);
    // Journal renders an empty list container
    expect(screen.getByLabelText('journal-entries')).toBeInTheDocument();
  });
});
