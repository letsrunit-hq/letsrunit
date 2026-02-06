import { isLoggedIn } from '@/libs/auth';
import { connect } from '@/libs/supabase/server';
import { User } from 'lucide-react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import React from 'react';

export type AuthButtonProps = {
  className?: string;
};

export async function AuthButton({ className }: AuthButtonProps) {
  const supabase = await connect();
  const loggedIn = await isLoggedIn({ supabase });

  const label = loggedIn ? 'Dashboard' : 'Login';
  const href = loggedIn ? '/projects' : '/auth/login';
  const icon = loggedIn ? undefined : <User width="1rem" className="mr-1" />;

  return (
    <Link href={href} className={className} prefetch={false}>
      <Button label={label} icon={icon} size="small" />
    </Link>
  );
}

export default AuthButton;
