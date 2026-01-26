'use client';

import { ShimmerButton } from '@/components/shimmer-button';
import { useSupabase } from '@/hooks/use-supabase';
import { signup } from '@/libs/auth';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import React, { useState } from 'react';

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase({}, setError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFormFilled = email.length > 0 && password.length >= 8 && name.length > 0;

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      await signup({ email, password, name }, { supabase });
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailSignup} className="flex flex-column gap-4">
      {error && <Message severity="error" text={error} className="w-full justify-content-start" />}
      <div className="flex flex-column gap-2">
        <label htmlFor="name" className="text-sm text-color-secondary">
          Full Name
        </label>
        <IconField iconPosition="left">
          <InputIcon>
            <User size={20} />
          </InputIcon>
          <InputText
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full"
            required
          />
        </IconField>
      </div>

      <div className="flex flex-column gap-2">
        <label htmlFor="email" className="text-sm text-color-secondary">
          Email Address
        </label>
        <IconField iconPosition="left" className="w-full">
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
        <label htmlFor="password" className="text-sm text-color-secondary">
          Password
        </label>
        <IconField iconPosition="left" className="w-full">
          <InputIcon>
            <Lock size={20} />
          </InputIcon>
          <InputText
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full"
            required
            minLength={8}
          />
        </IconField>
        <p className="mt-1 text-xs text-zinc-500">Must be at least 8 characters</p>
      </div>

      <ShimmerButton
        type="submit"
        disabled={isLoading}
        shimmer={isFormFilled}
        className="w-full py-2-5 mt-2"
        style={{ background: 'linear-gradient(to right, #f97316, #d97706)', border: 'none' }}
      >
        {isLoading ? 'Creating account...' : 'Create account'}
        {!isLoading && <ArrowRight />}
      </ShimmerButton>

      <p className="text-xs text-zinc-500 text-center mt-2">
        By creating an account, you agree to our{' '}
        <Link href="#" className="text-orange-400 hover:text-orange-300">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="#" className="text-orange-400 hover:text-orange-300">
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}

export default SignupForm;
