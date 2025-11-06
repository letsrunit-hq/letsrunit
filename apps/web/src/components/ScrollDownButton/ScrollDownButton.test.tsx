import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollDownButton } from './ScrollDownButton';

describe('ScrollDownButton', () => {
  it('renders button with icon', () => {
    render(<ScrollDownButton ariaLabel="Scroll to learn more" />);
    const btn = screen.getByLabelText(/scroll to learn more/i);
    expect(btn).toBeInTheDocument();
  });
});
