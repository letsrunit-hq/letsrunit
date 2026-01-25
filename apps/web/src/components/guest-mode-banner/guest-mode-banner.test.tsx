import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { GuestModeBanner } from './guest-mode-banner';

describe('GuestModeBanner', () => {
  it('renders correctly with the expected content', () => {
    render(<GuestModeBanner />);

    expect(screen.getByText("You're in guest mode")).toBeInTheDocument();
    expect(screen.getByText('Expires in 24 hours')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your project is temporary. Create a free account to save it forever and unlock team features./i,
      ),
    ).toBeInTheDocument();
  });

  it('contains a link to the signup page with a button', () => {
    render(<GuestModeBanner />);

    const link = screen.getByRole('link', { name: /create account/i });
    expect(link).toHaveAttribute('href', '/auth/signup');

    const button = screen.getByRole('button', { name: /create account/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('p-button');
  });
});
