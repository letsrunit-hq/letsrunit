import { NavigationMenu } from '@/components/navigation-menu/navigation-menu';
import { getUser } from '@/libs/auth';
import { getPathname, getSelected } from '@/libs/nav';
import { connect } from '@/libs/supabase/server';
import { maybe } from '@letsrunit/model';
import React from 'react';

export async function Navigation() {
  const supabase = await connect();

  const user = await getUser({ supabase }).catch(maybe);
  if (!user) return null;

  const { data: accounts } = await supabase.rpc('get_accounts');
  const organizations = (accounts || []).filter((a: any) => !a.personal_account && a.account_id !== user.id);
  const { data: projects } = await supabase.from('projects').select('id, name, favicon');

  const userInfo = {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
  };

  const pathname = await getPathname();
  const selected = await getSelected(pathname, { supabase });

  return (
    <NavigationMenu
      organizations={organizations}
      projects={projects || []}
      user={userInfo}
      selected={selected}
    />
  );
}

export default Navigation;
