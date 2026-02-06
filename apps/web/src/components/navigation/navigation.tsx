'use client';

import { NavigationMenu } from '@/components/navigation/navigation-menu/navigation-menu';
import type { Organization, UserInfo } from '@/components/navigation/types';
import { useSelected } from '@/hooks/use-selected';
import { getUser, isLoggedIn } from '@/libs/auth';
import { connect } from '@/libs/supabase/browser';
import { type Project } from '@letsrunit/model';
import React, { useEffect, useState } from 'react';

export function Navigation() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name' | 'favicon'>[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = useSelected();

  useEffect(() => {
    async function fetchData() {
      const supabase = connect();

      if (!(await isLoggedIn({ supabase }))) {
        setLoading(false);
        return;
      }

      const authUser = await getUser({ supabase });
      const userInfo: UserInfo = {
        name: authUser.user_metadata?.full_name || 'User',
        email: authUser.email || '',
        isAnonymous: authUser.is_anonymous,
      };
      setUser(userInfo);

      const { data: accounts } = await supabase.rpc('get_accounts');
      setOrganizations((accounts || []).filter((a: any) => !a.personal_account));

      const { data: projectsData } = await supabase.from('projects').select('id, name, favicon');
      setProjects(projectsData || []);

      setLoading(false);
    }

    void fetchData();
  }, []);

  if (loading || !user) return null;

  return <NavigationMenu organizations={organizations} projects={projects} user={user} selected={selected} />;
}

export default Navigation;
