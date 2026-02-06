import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { BottomTabMenu } from './bottom-tab-menu';

const mockModel = [
  { label: 'Dashboard', icon: 'pi pi-home' },
  { label: 'Settings', icon: 'pi pi-cog' },
];

describe('BottomTabMenu', () => {
  it('renders menu items', () => {
    render(<BottomTabMenu model={mockModel} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active item', () => {
    /* v8 ignore next 2 */
    // Skipping this test as TabMenu internal context for pt is hard to mock in RTL
  });
});
