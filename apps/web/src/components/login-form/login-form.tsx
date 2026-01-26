'use client';

import { ShimmerButton } from '@/components/shimmer-button';
import { useSupabase } from '@/hooks/use-supabase';
import { login } from '@/libs/auth';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import React, { useState } from 'react';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase({}, setError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFormFilled = email.length > 0 && password.length > 0;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password }, { supabase });
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailLogin} className="flex flex-column gap-4">
      {error && <Message severity="error" text={error} className="w-full justify-content-start" />}
      <div className="flex flex-column gap-2">
        <label htmlFor="email" className="text-sm text-color-secondary">
          Email Address
        </label>
        <IconField iconPosition="left">
          <InputIcon>
            <Mail size={20} />
          </InputIcon>
          <InputText
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full"
            required
          />
        </IconField>
      </div>

      <div className="flex flex-column gap-2">
        <div className="flex align-items-center justify-content-between">
          <label htmlFor="password" className="text-sm text-color-secondary">
            Password
          </label>
          <Link href="#" className="text-sm text-orange-400 hover:text-orange-300">
            Forgot password?
          </Link>
        </div>
        <IconField iconPosition="left">
          <InputIcon>
            <Lock size={20} />
          </InputIcon>
          <InputText
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            required
          />
        </IconField>
      </div>

      <ShimmerButton type="submit" disabled={isLoading} shimmer={isFormFilled} className="w-full py-2-5 mt-2">
        {isLoading ? 'Signing in...' : 'Sign in'}
        {!isLoading && <ArrowRight />}
      </ShimmerButton>
    </form>
  );
}

export default LoginForm;
