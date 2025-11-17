import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Journal from './journal';

const baseEntry = {
  meta: {},
  artifacts: [],
  createdAt: 't',
};

describe('Journal component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders entries in a Timeline with custom markers and no artifacts', () => {
    const data = {
      entries: [
        { id: '1', type: 'prepare', message: 'Doing A', ...baseEntry },
        {
          id: '2',
          type: 'success',
          message: 'Did A',
          ...baseEntry,
          artifacts: [
            { name: 'screenshot-1.png', url: 'https://cdn/1.png' },
            { name: 'screenshot-2.png', url: 'https://cdn/2.png' },
          ],
        },
      ],
    };

    render(<Journal data={data} />);

    // Messages rendered
    expect(screen.getByText('Doing A')).toBeInTheDocument();
    expect(screen.getByText('Did A')).toBeInTheDocument();

    // Custom markers via PrimeIcons exist
    expect(document.querySelector('.pi-spinner')).toBeTruthy();
    expect(document.querySelector('.pi-check')).toBeTruthy();

    // No artifacts are displayed
    expect(screen.queryByText('screenshot-1.png')).toBeNull();
    expect(screen.queryByText('screenshot-2.png')).toBeNull();

    // No card title rendered
    expect(screen.queryByText('Journal')).toBeNull();
  });
});
