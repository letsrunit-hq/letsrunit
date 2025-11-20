import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

describe('page projects-owner-ref', () => {
  it('renders', () => {
    render(<Page />);
  });
});