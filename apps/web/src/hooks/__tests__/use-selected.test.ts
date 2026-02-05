import { renderHook, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { useSelected } from '../use-selected';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@/libs/supabase/browser', () => ({
  connect: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null })),
        })),
      })),
    })),
  })),
}));

describe('useSelected', () => {
  it('identifies project and page from /projects/:id', async () => {
    vi.mocked(usePathname).mockReturnValue('/projects/123');
    const { result } = renderHook(() => useSelected());

    await waitFor(() => {
      expect(result.current).toEqual({
        project: '123',
        page: 'project',
      });
    });
  });

  it('identifies project and nested page', async () => {
    vi.mocked(usePathname).mockReturnValue('/projects/123/runs');
    const { result } = renderHook(() => useSelected());

    await waitFor(() => {
      expect(result.current).toEqual({
        project: '123',
        page: 'project/runs',
      });
    });
  });

  it('identifies org from /org/:id', async () => {
    vi.mocked(usePathname).mockReturnValue('/org/abc');
    const { result } = renderHook(() => useSelected());

    await waitFor(() => {
      expect(result.current).toEqual({
        org: 'abc',
        page: undefined,
      });
    });
  });
});
