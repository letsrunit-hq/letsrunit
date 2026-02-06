import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Layout from './layout';

describe('Auth Layout', () => {
  it('renders children', () => {
    render(
      <Layout>
        <div data-testid="child">Child Content</div>
      </Layout>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders back button linking to home', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>,
    );
    const backButton = screen.getByRole('link', { name: /back/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', '/');
  });

  it('has correct data-segment attribute', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>,
    );
    expect(container.querySelector('section')).toHaveAttribute('data-segment', 'auth');
  });
});
