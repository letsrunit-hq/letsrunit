import { AuthCard } from '@/components/auth-card';
import { GithubLoginButton } from '@/components/github-login-button';
import { LoginForm } from '@/components/login-form';
import Link from 'next/link';
import { Divider } from 'primereact/divider';
import React from 'react';

export default async function Page() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue testing"
      footer={
        <p className="text-zinc-400">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-orange-400 hover:text-orange-300 font-medium">
            Create account
          </Link>
        </p>
      }
    >
      <div className="flex flex-column gap-4">
        <GithubLoginButton />

        <Divider align="center" className="my-2">
          <span className="text-sm text-color-secondary px-2">Or continue with email</span>
        </Divider>

        <LoginForm />
      </div>
    </AuthCard>
  );
}
