import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DropdownMenu } from './dropdown-menu';

describe('DropdownMenu', () => {
  it('renders and toggles menu', () => {
    const model = [{ label: 'Item 1' }];
    const selectedItem = { name: 'Test Item', subtext: 'Subtext' };

    render(
      <DropdownMenu model={model} selectedItem={selectedItem} className="test-button" title="test-title" />
    );

    const triggerBtn = screen.getByRole('button');
    expect(triggerBtn).toHaveClass('test-button');
    expect(triggerBtn).toHaveAttribute('title', 'test-title');
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Subtext')).toBeInTheDocument();

    fireEvent.click(triggerBtn);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('renders in icon variant', () => {
    const model = [{ label: 'Item 1' }];
    const selectedItem = { name: 'Test Item', image: 'T' };

    render(
      <DropdownMenu model={model} selectedItem={selectedItem} variant="icon" />
    );

    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
  });
});
