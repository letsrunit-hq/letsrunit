import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BackToTopButton } from './BackToTopButton';

describe('BackToTopButton', () => {
  it('renders button', () => {
    render(<BackToTopButton label="Back to top" />);
    const btn = screen.getByRole('button', { name: /back to top/i });
    expect(btn).toBeInTheDocument();
  });
});
