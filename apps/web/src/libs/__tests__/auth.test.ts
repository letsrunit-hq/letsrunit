import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureSignedIn, getUser, login, loginWithOAuth, signup } from '../auth';

const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockUpdateUser = vi.fn();
const mockLinkIdentity = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignInAnonymously = vi.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    updateUser: mockUpdateUser,
    linkIdentity: mockLinkIdentity,
    signInWithOAuth: mockSignInWithOAuth,
    signInAnonymously: mockSignInAnonymously,
  },
} as any;

describe('auth lib', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureSignedIn', () => {
    it('signs in anonymously if no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      mockSignInAnonymously.mockResolvedValue({ data: {}, error: null });

      await ensureSignedIn({ supabase: mockSupabase });

      expect(mockSignInAnonymously).toHaveBeenCalled();
    });

    it('does nothing if user exists', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: '1' } } });

      await ensureSignedIn({ supabase: mockSupabase });

      expect(mockSignInAnonymously).not.toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('returns user if exists', async () => {
      const user = { id: '1' };
      mockGetUser.mockResolvedValue({ data: { user } });

      const result = await getUser({ supabase: mockSupabase });
      expect(result).toBe(user);
    });

    it('throws if no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(getUser({ supabase: mockSupabase })).rejects.toThrow('Not signed in');
    });
  });

  describe('login', () => {
    it('calls signInWithPassword', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

      await login({ email: 't@e.com', password: 'p' }, { supabase: mockSupabase });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 't@e.com', password: 'p' });
    });

    it('throws if already signed in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: '1', is_anonymous: false } } });

      await expect(login({ email: 't@e.com', password: 'p' }, { supabase: mockSupabase })).rejects.toThrow(
        'Already signed in',
      );
    });

    it('allows login if currently anonymous', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: '1', is_anonymous: true } } });
      mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

      await login({ email: 't@e.com', password: 'p' }, { supabase: mockSupabase });

      expect(mockSignInWithPassword).toHaveBeenCalled();
    });
  });

  describe('signup', () => {
    it('calls signUp for new user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      mockSignUp.mockResolvedValue({ data: {}, error: null });

      await signup({ email: 't@e.com', password: 'p', name: 'N' }, { supabase: mockSupabase });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 't@e.com',
        password: 'p',
        options: { data: { full_name: 'N' } },
      });
    });

    it('calls updateUser for anonymous user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: '1', is_anonymous: true } } });
      mockUpdateUser.mockResolvedValue({ data: {}, error: null });

      await signup({ email: 't@e.com', password: 'p', name: 'N' }, { supabase: mockSupabase });

      expect(mockUpdateUser).toHaveBeenCalledWith({
        email: 't@e.com',
        password: 'p',
        data: { full_name: 'N' },
      });
    });

    it('throws if already signed in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: '1', is_anonymous: false } } });

      await expect(signup({ email: 't@e.com', password: 'p', name: 'N' }, { supabase: mockSupabase })).rejects.toThrow(
        'Already signed in',
      );
    });
  });

  describe('loginWithOAuth', () => {
    it('calls signInWithOAuth for new user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

      await loginWithOAuth({ provider: 'github', redirectTo: 'http://r.com' }, { supabase: mockSupabase });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: { redirectTo: 'http://r.com' },
      });
    });

    it('calls linkIdentity for anonymous user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: '1', is_anonymous: true } } });
      mockLinkIdentity.mockResolvedValue({ data: {}, error: null });

      await loginWithOAuth({ provider: 'github', redirectTo: 'http://r.com' }, { supabase: mockSupabase });

      expect(mockLinkIdentity).toHaveBeenCalledWith({
        provider: 'github',
        options: { redirectTo: 'http://r.com' },
      });
    });

    it('throws if already signed in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: '1', is_anonymous: false } } });

      await expect(loginWithOAuth({ provider: 'github' }, { supabase: mockSupabase })).rejects.toThrow(
        'Already signed in',
      );
    });
  });
});
