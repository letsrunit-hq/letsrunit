import { connect } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/libs/supabase/server', () => ({
  connect: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: vi.fn((url) => ({
      status: 302,
      headers: { location: url.toString() },
    })),
  },
}));

describe('route auth-callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to / when code is exchanged successfully', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    };
    vi.mocked(connect).mockResolvedValue(mockSupabase as any);

    const request = new Request('http://localhost:3000/auth/callback?code=test-code');
    const res = await GET(request);

    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
    expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/');
    expect(res.status).toBe(302);
  });

  it('redirects to next param when provided', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    };
    vi.mocked(connect).mockResolvedValue(mockSupabase as any);

    const request = new Request('http://localhost:3000/auth/callback?code=test-code&next=/dashboard');
    const res = await GET(request);

    expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
  });

  it('redirects to login with error if exchange fails', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: new Error('fail') }),
      },
    };
    vi.mocked(connect).mockResolvedValue(mockSupabase as any);

    const request = new Request('http://localhost:3000/auth/callback?code=test-code');
    const res = await GET(request);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/auth/login?error=Could not authenticate user',
    );
  });

  it('redirects to login with error if no code is provided', async () => {
    const request = new Request('http://localhost:3000/auth/callback');
    const res = await GET(request);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/auth/login?error=Could not authenticate user',
    );
  });

  it('uses x-forwarded-host when not in local environment', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    };
    vi.mocked(connect).mockResolvedValue(mockSupabase as any);

    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const request = new Request('http://localhost:3000/auth/callback?code=test-code', {
      headers: {
        'x-forwarded-host': 'myapp.com',
      },
    });
    const res = await GET(request);

    expect(NextResponse.redirect).toHaveBeenCalledWith('https://myapp.com/');

    process.env.NODE_ENV = originalEnv;
  });
});
