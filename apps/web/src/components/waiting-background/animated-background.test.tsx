import React from 'react';
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedBackground } from './animated-background';

describe(AnimatedBackground.name, () => {
  it('renders', () => {
    render(<AnimatedBackground />);
  });
});
