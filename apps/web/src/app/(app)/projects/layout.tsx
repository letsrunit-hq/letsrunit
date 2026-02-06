import { GuestModeBanner } from '@/components/guest-mode-banner';
import { isLoggedIn } from '@/libs/auth';
import { connect as connectServerSupabase } from '@/libs/supabase/server';
import React from 'react';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await connectServerSupabase();
  const loggedIn = await isLoggedIn({ supabase });

  return (
    <div className="container p-4 md:p-6 lg:p-7`}">
      {loggedIn === 'anonymous' && <GuestModeBanner className="mb-6" />}
      {children}
    </div>
  );
}
