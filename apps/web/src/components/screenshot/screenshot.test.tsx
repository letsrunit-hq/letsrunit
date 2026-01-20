import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { Screenshot } from './screenshot';

describe('Screenshot', () => {
  it('shows the image when src is provided', () => {
    render(<Screenshot src="/demo.png" alt="Example screenshot" width={400} height={300} />);

    expect(screen.getByAltText('Example screenshot')).toBeInTheDocument();
  });

  it('shows the placeholder when src is missing', () => {
    render(<Screenshot width={400} height={300} />);

    expect(screen.getByText('No screenshot')).toBeInTheDocument();
  });
});
