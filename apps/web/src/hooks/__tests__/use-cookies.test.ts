import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCookies } from '../use-cookies';

describe('useCookies', () => {
  beforeEach(() => {
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  });

  it('sets and gets a cookie', () => {
    const { result } = renderHook(() => useCookies());
    act(() => {
      result.current.setCookie('test-cookie', 'test-value');
    });
    expect(result.current.getCookie('test-cookie')).toBe('test-value');
  });

  it('returns undefined for non-existent cookie', () => {
    const { result } = renderHook(() => useCookies());
    expect(result.current.getCookie('missing')).toBeUndefined();
  });
});
