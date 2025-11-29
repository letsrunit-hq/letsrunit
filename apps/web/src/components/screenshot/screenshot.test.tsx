import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Screenshot } from './screenshot';

describe('Screenshot', () => {
  it('shows the image when src is provided', () => {
    render(<Screenshot src="/demo.png" alt="Example screenshot" width={400} height={300} />);

    expect(screen.getByAltText('Example screenshot')).toBeInTheDocument();
  });

  it('shows the placeholder when src is missing', () => {
    const { container } = render(<Screenshot width={400} height={300} />);

    expect(screen.getByText('No screenshot')).toBeInTheDocument();
    expect(container.querySelector('.pi.pi-desktop')).toBeInTheDocument();
  });
});
