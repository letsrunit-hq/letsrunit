import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CreateTestDialog } from './create-test-dialog';

describe('CreateTestDialog', () => {
  it('renders dialog with fields and actions', () => {
    render(<CreateTestDialog visible baseUrl="https://example.com" cancel={vi.fn()} generate={vi.fn()} />);

    // Header
    expect(screen.getByText('Add new test')).toBeInTheDocument();

    // Start page input group
    expect(screen.getByText('Start page')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('/path')).toBeInTheDocument();

    // Instructions
    expect(screen.getByText('What do you want to test?')).toBeInTheDocument();

    // Actions
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
