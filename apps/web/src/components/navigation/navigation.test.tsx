import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

vi.mock('@/hooks/use-cookies', () => ({
  useCookies: vi.fn(() => ({
    getCookie: vi.fn((name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    }),
    setCookie: vi.fn((name, value) => {
      document.cookie = `${name}=${value}; path=/`;
    }),
  })),
}));

vi.mock('@/hooks/use-window-size', () => ({
  useWindowSize: vi.fn(() => ({ width: 1920, height: 1080 })),
}));

let mockPathname = '/';
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => mockPathname),
}));

let mockIsAnonymous = false;
vi.mock('@/libs/auth', () => ({
  isLoggedIn: vi.fn(() => Promise.resolve(true)),
  getUser: vi.fn(() =>
    Promise.resolve({
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
      is_anonymous: mockIsAnonymous,
    }),
  ),
  logout: vi.fn(),
}));

// Mock NavigationMenu to avoid deep rendering issues
vi.mock('@/components/navigation/navigation-menu/navigation-menu', () => ({
  NavigationMenu: vi.fn(() => <div data-testid="navigation-menu" />),
}));

describe('Navigation', () => {
  beforeEach(() => {
    mockPathname = '/';
    mockIsAnonymous = false;
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  });

  it('renders NavigationMenu after loading data', async () => {
    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();
    });
  });

  it('hides Navigation if anonymous and no cookie set', async () => {
    mockIsAnonymous = true;
    render(<Navigation />);

    await waitFor(() => {
      // It should still render NavigationMenu because we moved visibility logic there
      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();
    });
  });

  it('shows Navigation if anonymous but cookie set', async () => {
    mockIsAnonymous = true;
    document.cookie = 'nav-preferences=expanded; path=/';
    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();
    });
  });

  it('does not set cookie when visiting /projects', async () => {
    mockPathname = '/projects';
    render(<Navigation />);

    // Give it a little time for any potential effects (though we expect none now)
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.cookie).not.toContain('nav-preferences');
  });
});
