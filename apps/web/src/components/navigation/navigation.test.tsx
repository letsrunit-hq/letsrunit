import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Navigation } from './navigation';

vi.mock('@/libs/supabase/browser', () => ({
  connect: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: { full_name: 'Test User' },
            },
          },
        }),
      ),
    },
    rpc: vi.fn(() => Promise.resolve({ data: [] })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null })),
        })),
        then: vi.fn((cb) => Promise.resolve({ data: [] }).then(cb)),
      })),
    })),
  })),
}));

vi.mock('@/hooks/use-selected', () => ({
  useSelected: vi.fn(() => ({})),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
}));

vi.mock('@/libs/auth', () => ({
  isLoggedIn: vi.fn(() => Promise.resolve(true)),
  getUser: vi.fn(() =>
    Promise.resolve({
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
      is_anonymous: false,
    }),
  ),
  logout: vi.fn(),
}));

// Mock NavigationMenu to avoid deep rendering issues
vi.mock('@/components/navigation/navigation-menu/navigation-menu', () => ({
  NavigationMenu: vi.fn(() => <div data-testid="navigation-menu" />),
}));

describe('Navigation', () => {
  it('renders NavigationMenu after loading data', async () => {
    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();
    });
  });
});
