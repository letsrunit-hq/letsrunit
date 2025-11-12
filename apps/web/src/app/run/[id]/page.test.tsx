import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

describe('page explore-url', () => {
  it('renders', () => {
    render(<Page />);
  });
});