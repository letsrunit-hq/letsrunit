import { AuthCard } from '@/components/auth-card';
import { GithubLoginButton } from '@/components/github-login-button';
import { SignupForm } from '@/components/signup-form';
import Link from 'next/link';
import { Divider } from 'primereact/divider';
import React from 'react';

export default async function Page() {
  return (
    <AuthCard
      title="Create an account"
      subtitle="Start automating your tests in minutes"
      footer={
        <p className="text-zinc-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="flex flex-column gap-4">
        <GithubLoginButton />

        <Divider align="center" className="my-2">
          <span className="text-sm text-color-secondary px-2">Or continue with email</span>
        </Divider>

        <SignupForm />
      </div>
    </AuthCard>
  );
}
