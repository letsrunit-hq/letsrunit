import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DropdownMenu } from './dropdown-menu';

describe('DropdownMenu', () => {
  it('renders and toggles menu', () => {
    const model = [{ label: 'Item 1' }];
    const selectedItem = { name: 'Test Item', subtext: 'Subtext' };

    render(<DropdownMenu model={model} selectedItem={selectedItem} className="test-button" title="test-title" />);

    const triggerBtn = screen.getByRole('button');
    expect(triggerBtn).toHaveClass('test-button');
    expect(triggerBtn).toHaveAttribute('title', 'test-title');
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Subtext')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();

    fireEvent.click(triggerBtn);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
  });

  it('renders in icon variant', () => {
    const model = [{ label: 'Item 1' }];
    const selectedItem = { name: 'Test Item', image: 'T' };

    render(<DropdownMenu model={model} selectedItem={selectedItem} variant="icon" />);

    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
  });

  it('renders links with next/link when url is provided', () => {
    const model = [{ label: 'Link Item', url: '/test-url' }];
    const selectedItem = { name: 'Test' };

    render(<DropdownMenu model={model} selectedItem={selectedItem} />);

    fireEvent.click(screen.getByRole('button'));

    const link = document.querySelector('.p-menuitem-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test-url');
    expect(screen.getByText('Link Item')).toBeInTheDocument();
  });

  it('handles nested menu items', () => {
    const model = [
      {
        label: 'Submenu',
        items: [[{ label: 'Sub Item 1', url: '/sub-1' }]],
      },
    ];
    const selectedItem = { name: 'Test' };

    render(<DropdownMenu model={model} selectedItem={selectedItem} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Submenu')).toBeInTheDocument();
  });

  it('renders without selectedItem', () => {
    const model = [{ label: 'Item 1' }];
    render(<DropdownMenu model={model} />);
    expect(screen.queryByRole('avatar')).not.toBeInTheDocument();
  });
});
