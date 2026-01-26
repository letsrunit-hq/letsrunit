import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { AuthCard } from './auth-card';

describe('AuthCard', () => {
  it('renders title and subtitle', () => {
    render(
      <AuthCard title="Test Title" subtitle="Test Subtitle">
        <div>Content</div>
      </AuthCard>,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
