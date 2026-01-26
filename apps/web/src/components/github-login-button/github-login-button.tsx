'use client';

import { useToast } from '@/context/toast-context';
import { useSupabase } from '@/hooks/use-supabase';
import { loginWithOAuth } from '@/libs/auth';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { Button } from 'primereact/button';
import React, { useCallback } from 'react';

export interface GithubLoginButtonProps {
  className?: string;
}

export function GithubLoginButton({ className }: GithubLoginButtonProps) {
  const toast = useToast();
  const setError = useCallback(
    (err: string | null) => {
      if (err) {
        toast.show({
          severity: 'error',
          summary: 'Authentication Error',
          detail: err,
          life: 5000,
        });
      }
    },
    [toast],
  );
  const supabase = useSupabase({}, setError);

  const handleGithubLogin = async () => {
    if (!supabase) return;

    try {
      await loginWithOAuth(
        {
          provider: 'github',
          redirectTo: `${window.location.origin}/auth/callback`,
        },
        { supabase },
      );
    } catch (err: any) {
      setError(err.message || 'An error occurred during GitHub login');
    }
  };

  return (
    <Button
      onClick={handleGithubLogin}
      className={`w-full py-2-5 flex align-items-center justify-content-center ${className || ''}`}
      severity="contrast"
    >
      <SiGithub width={20} className="mr-2" /> <span className="text-base">Continue with GitHub</span>
    </Button>
  );
}

export default GithubLoginButton;
