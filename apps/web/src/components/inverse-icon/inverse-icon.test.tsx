import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InverseIcon } from './inverse-icon';

describe('InverseIcon', () => {
  it('renders the icon and overlay with sizing', () => {
    const StubIcon = ({ size = 0 }: { size?: string | number }) => (
      <svg data-testid="stub-icon" data-size={size} />
    );

    const { container } = render(<InverseIcon Icon={StubIcon} size={32} />);

    expect(screen.getByTestId('stub-icon')).toHaveAttribute('data-size', '32');

    const slashOverlay = container.querySelector('svg:not([data-testid="stub-icon"])');
    expect(slashOverlay).not.toBeNull();
    expect(slashOverlay).toHaveClass('absolute', 'inset-0');
    expect(slashOverlay).toHaveAttribute('width', '32');
    expect(slashOverlay).toHaveAttribute('height', '32');
  });
});