import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateButton } from './create-button';

describe('CreateButton', () => {
  it('renders the prompt text', () => {
    const onClick = vi.fn();
    render(<CreateButton onClick={onClick} />);
    expect(screen.getByText('Create a new test')).toBeInTheDocument();
  });

  it('invokes onClick when the panel is clicked', () => {
    const onClick = vi.fn();
    render(<CreateButton onClick={onClick} />);
    const panelButton = screen.getByRole('button');
    fireEvent.click(panelButton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
