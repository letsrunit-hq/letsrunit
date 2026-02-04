import { describe, expect, it, vi } from 'vitest';
import { getPathname, getSelected } from '../nav';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('../supabase/server', () => ({
  connect: vi.fn(),
}));

describe('getPathname', () => {
  it('should return x-pathname from headers if present', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-pathname': '/test-path' }) as any);

    const pathname = await getPathname();
    expect(pathname).toBe('/test-path');
  });

  it('should return / if x-pathname is missing', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockResolvedValueOnce(new Headers({}) as any);

    const pathname = await getPathname();
    expect(pathname).toBe('/');
  });
});

describe('getSelected', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  } as any;

  it('should return empty selected for root path', async () => {
    const { connect } = await import('../supabase/server');
    vi.mocked(connect).mockResolvedValue(mockSupabase);
    const selected = await getSelected('/');
    expect(selected).toEqual({});
  });

  it('should identify project dashboard from path', async () => {
    const { connect } = await import('../supabase/server');
    vi.mocked(connect).mockResolvedValue(mockSupabase);
    mockSupabase.single.mockResolvedValueOnce({ data: null });

    const selected = await getSelected('/projects/123');
    expect(selected).toEqual({
      project: '123',
      page: 'project',
    });
  });

  it('should identify project run history from path', async () => {
    const { connect } = await import('../supabase/server');
    vi.mocked(connect).mockResolvedValue(mockSupabase);
    mockSupabase.single.mockResolvedValueOnce({ data: null });

    const selected = await getSelected('/projects/123/runs');
    expect(selected).toEqual({
      project: '123',
      page: 'project/runs',
    });
  });

  it('should identify project run history from /history path', async () => {
    const { connect } = await import('../supabase/server');
    vi.mocked(connect).mockResolvedValue(mockSupabase);
    mockSupabase.single.mockResolvedValueOnce({ data: null });

    const selected = await getSelected('/projects/123/history');
    expect(selected).toEqual({
      project: '123',
      page: 'project/history',
    });
  });

  it('should identify project settings from path', async () => {
    const { connect } = await import('../supabase/server');
    vi.mocked(connect).mockResolvedValue(mockSupabase);
    mockSupabase.single.mockResolvedValueOnce({ data: null });

    const selected = await getSelected('/projects/123/settings');
    expect(selected).toEqual({
      project: '123',
      page: 'project/settings',
    });
  });

  it('should identify organization settings from path', async () => {
    const { connect } = await import('../supabase/server');
    vi.mocked(connect).mockResolvedValue(mockSupabase);

    const selected = await getSelected('/org/abc/settings');
    expect(selected).toEqual({
      org: 'abc',
      page: 'org/settings',
    });
  });

  it('should identify organization from path', async () => {
    const { connect } = await import('../supabase/server');
    vi.mocked(connect).mockResolvedValue(mockSupabase);

    const selected = await getSelected('/org/abc/projects');
    expect(selected).toEqual({
      org: 'abc',
      page: 'org/projects',
    });
  });

  describe('with supabase', () => {
    it('should resolve org for project path', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { account_id: 'org-123' },
        error: null,
      });

      const selected = await getSelected('/projects/proj-123', { supabase: mockSupabase });

      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'proj-123');
      expect(selected).toEqual({
        project: 'proj-123',
        org: 'org-123',
        page: 'project',
      });
    });

    it('should resolve project and org for run path', async () => {
      // First call for run
      mockSupabase.single.mockResolvedValueOnce({
        data: { project_id: 'proj-123' },
        error: null,
      });
      // Second call for project
      mockSupabase.single.mockResolvedValueOnce({
        data: { account_id: 'org-123' },
        error: null,
      });

      const selected = await getSelected('/runs/run-123', { supabase: mockSupabase });

      expect(mockSupabase.from).toHaveBeenCalledWith('runs');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'run-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'proj-123');

      expect(selected).toEqual({
        project: 'proj-123',
        org: 'org-123',
      });
    });

    it('should use default connect if supabase option is not provided', async () => {
      const { connect } = await import('../supabase/server');
      vi.mocked(connect).mockResolvedValueOnce(mockSupabase);

      mockSupabase.single.mockResolvedValueOnce({
        data: { account_id: 'org-123' },
        error: null,
      });

      const selected = await getSelected('/projects/proj-123');

      expect(connect).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(selected.org).toBe('org-123');
    });
  });
});
