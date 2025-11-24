import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectPanel } from './project-panel';

describe('ProjectPanel', () => {
  it('renders labels and children', () => {
    render(
      <ProjectPanel>
        <span>Hello</span>
      </ProjectPanel>,
    );

    // Labels converted to PrimeFlex text utilities
    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();

    // Link text
    expect(screen.getByText('ecommerce.example.com')).toBeInTheDocument();

    // Children should render
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
