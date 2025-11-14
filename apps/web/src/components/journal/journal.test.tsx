import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Journal from './journal';

// Mock Galleria to avoid PrimeReact internals
vi.mock('primereact/galleria', () => ({
  Galleria: (props: any) => (
    <div data-testid="galleria" data-count={props.value?.length ?? 0}>Galleria</div>
  ),
}));

function mockMatchMedia(matches: boolean) {
  // @ts-expect-error jsdom window
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

const baseEntry = {
  meta: {},
  artifacts: [],
  createdAt: 't',
};

describe('Journal component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders entries and shows gallery on desktop', () => {
    mockMatchMedia(false); // not mobile

    const data = {
      entries: [
        { id: '1', type: 'prepare', message: 'Doing A', ...baseEntry },
        { id: '2', type: 'success', message: 'Did A', ...baseEntry, artifacts: [
          { name: 'screenshot-1.png', url: 'https://cdn/1.png' },
          { name: 'screenshot-2.png', url: 'https://cdn/2.png' },
        ] },
      ],
    };

    render(<Journal data={data} />);

    // Entries list exists
    const list = screen.getByLabelText('journal-entries');
    expect(list).toBeInTheDocument();
    // Messages rendered
    expect(screen.getByText('Doing A')).toBeInTheDocument();
    expect(screen.getByText('Did A')).toBeInTheDocument();

    // Gallery visible and receives 2 screenshots
    const galleria = screen.getByTestId('galleria');
    expect(galleria).toBeInTheDocument();
    expect(galleria.getAttribute('data-count')).toBe('2');

    // Status visuals exist: spinner for prepare, success tag
    expect(document.querySelector('.pi-spinner')).toBeTruthy();
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('hides gallery on mobile', () => {
    mockMatchMedia(true); // mobile

    const data = {
      entries: [
        { id: '1', type: 'info', message: 'Hello', ...baseEntry, artifacts: [ { name: 'screenshot-1.png', url: 'u' } ] },
      ],
    };

    render(<Journal data={data} />);

    // Gallery should not be rendered
    expect(screen.queryByTestId('galleria')).toBeNull();
  });
});
