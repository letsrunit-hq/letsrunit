import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageWithButton } from './message-with-button';

describe('MessageWithButton', () => {
  it('renders children and button text', () => {
    const onClick = vi.fn();
    render(
      <MessageWithButton buttonText="Do it" onClick={onClick}>
        Hello
      </MessageWithButton>,
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Do it' })).toBeInTheDocument();
  });

  it('calls onClick when button is clicked', () => {
    const onClick = vi.fn();
    render(
      <MessageWithButton buttonText="Click me" onClick={onClick}>
        Notice
      </MessageWithButton>,
    );

    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
