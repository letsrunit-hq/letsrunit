import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DropdownMenu } from './dropdown-menu';

describe('DropdownMenu', () => {
  it('renders and toggles menu', () => {
    const model = [{ label: 'Item 1' }];
    const trigger = (toggle: any) => (
      <button onClick={toggle} data-testid="trigger">
        Trigger
      </button>
    );

    render(<DropdownMenu model={model} trigger={trigger} />);

    const triggerBtn = screen.getByTestId('trigger');
    expect(triggerBtn).toBeInTheDocument();

    // PrimeReact Menu is usually in the DOM but hidden until triggered
    // In test environment it might need fireEvent
    fireEvent.click(triggerBtn);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
