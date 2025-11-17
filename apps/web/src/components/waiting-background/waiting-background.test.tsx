import React from 'react';
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { WaitingBackground } from './waiting-background';

describe('WaitingBackground', () => {
  it('renders', () => {
    render(<WaitingBackground />);
  });
});
