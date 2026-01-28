import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { Navigation } from './navigation';

describe('Navigation', () => {
  it('renders without crashing', () => {
    const { container } = render(<Navigation />);
    expect(container).toBeInTheDocument();
  });
});
