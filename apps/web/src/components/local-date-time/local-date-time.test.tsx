import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { LocalDateTime } from './local-date-time';

describe('LocalDateTime', () => {
  const testDate = new Date('2024-01-23T12:00:00Z');

  it('renders formatted date in default locale', () => {
    render(<LocalDateTime date={testDate} />);

    // en-UK default: 23 Jan 2024, 12:00
    // Note: The exact format might depend on the environment's timezone and Intl support,
    // but we can at least check if some part of it is present or use a more robust way to check.
    expect(screen.getByText(/23/)).toBeInTheDocument();
    expect(screen.getByText(/Jan/)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('renders with a different locale', () => {
    render(<LocalDateTime date={testDate} locale="en-US" />);
    // en-US: Jan 23, 2024, 12:00 PM (or similar)
    expect(screen.getByText(/Jan 23, 2024/)).toBeInTheDocument();
  });

  it('applies custom options', () => {
    render(<LocalDateTime date={testDate} options={{ dateStyle: 'full', timeStyle: 'full' }} locale="en-GB" />);
    // en-GB full: Tuesday, 23 January 2024 at 12:00:00 Coordinated Universal Time
    expect(screen.getByText(/Tuesday/)).toBeInTheDocument();
    expect(screen.getByText(/January/)).toBeInTheDocument();
  });

  it('updates when date changes', () => {
    const { rerender } = render(<LocalDateTime date={testDate} />);
    expect(screen.getByText(/23/)).toBeInTheDocument();

    const newDate = new Date('2024-02-24T12:00:00Z');
    rerender(<LocalDateTime date={newDate} />);
    expect(screen.getByText(/24/)).toBeInTheDocument();
    expect(screen.getByText(/Feb/)).toBeInTheDocument();
  });

  it('sets the dateTime attribute correctly', () => {
    render(<LocalDateTime date={testDate} />);
    const timeElement = screen.getByText(/23/).closest('time');
    expect(timeElement).toHaveAttribute('dateTime', testDate.toISOString());
  });
});
