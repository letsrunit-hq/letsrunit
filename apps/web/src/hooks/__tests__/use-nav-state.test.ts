import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavState } from '../use-nav-state';

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

let mockWidth: number | undefined = 1920;
vi.mock('@/hooks/use-window-size', () => ({
  useWindowSize: vi.fn(() => ({ width: mockWidth })),
}));

let mockPathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => mockPathname),
}));

describe('useNavState', () => {
  beforeEach(() => {
    mockWidth = 1920;
    mockPathname = '/';
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    vi.clearAllMocks();
  });

  it('initializes to expanded for large screens', () => {
    const { result } = renderHook(() => useNavState({ isAnonymous: false }));
    expect(result.current[0]).toBe('expanded');
  });

  it('initializes to collapsed for small screens', () => {
    mockWidth = 1024;
    const { result } = renderHook(() => useNavState({ isAnonymous: false }));
    expect(result.current[0]).toBe('collapsed');
  });

  it('initializes to hidden for anonymous users without cookie', () => {
    const { result } = renderHook(() => useNavState({ isAnonymous: true }));
    expect(result.current[0]).toBe('hidden');
  });

  it('restores from cookie even for anonymous users', () => {
    document.cookie = 'nav-preferences=collapsed; path=/';
    const { result } = renderHook(() => useNavState({ isAnonymous: true }));
    expect(result.current[0]).toBe('collapsed');
  });

  it('sets cookie and updates state when visiting /projects', () => {
    mockPathname = '/projects';
    const { result } = renderHook(() => useNavState({ isAnonymous: true }));
    expect(result.current[0]).toBe('expanded');
    expect(document.cookie).toContain('nav-preferences=expanded');
  });

  it('updates state and cookie when calling setNavState', () => {
    const { result } = renderHook(() => useNavState({ isAnonymous: false }));
    act(() => {
      const [, setNavState] = result.current;
      setNavState('collapsed');
    });
    expect(result.current[0]).toBe('collapsed');
    expect(document.cookie).toContain('nav-preferences=collapsed');
  });

  it('handles function updates in setNavState', () => {
    const { result } = renderHook(() => useNavState({ isAnonymous: false }));
    act(() => {
      const [, setNavState] = result.current;
      setNavState((prev) => (prev === 'expanded' ? 'collapsing' : 'expanded'));
    });
    expect(result.current[0]).toBe('collapsing');
  });
});
