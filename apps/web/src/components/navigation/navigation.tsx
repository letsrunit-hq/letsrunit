import { NavigationMenu } from '@/components/navigation-menu/navigation-menu';
import { ensureSignedIn } from '@/libs/auth';
import { connect } from '@/libs/supabase/server';
import React from 'react';

export async function Navigation() {
  const supabase = await connect();

  await ensureSignedIn({ supabase });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: accounts } = await supabase.rpc('get_accounts');
  const { data: projects } = await supabase.from('projects').select('id, name');

  const selectedOrg = accounts?.[0] || { account_id: '', name: '' };
  const selectedProject = projects?.[0] || { id: '', name: '' };

  const userInfo = {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
  };

  return (
    <NavigationMenu
      organizations={accounts || []}
      projects={projects || []}
      selectedOrg={selectedOrg}
      selectedProject={selectedProject}
      user={userInfo}
    />
  );
}

export default Navigation;
