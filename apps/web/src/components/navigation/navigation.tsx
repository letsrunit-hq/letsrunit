'use client';

import { NavigationMenu } from '@/components/navigation-menu/navigation-menu';
import { useSelected } from '@/hooks/use-selected';
import { connect } from '@/libs/supabase/browser';
import type { Project } from '@letsrunit/model';
import React, { useEffect, useState } from 'react';
import type { Organization, UserInfo } from '../navigation-menu/navigation-menu';

export function Navigation() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name' | 'favicon'>[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = useSelected();

  useEffect(() => {
    async function fetchData() {
      const supabase = connect();

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      const userInfo: UserInfo = {
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
      };
      setUser(userInfo);

      const { data: accounts } = await supabase.rpc('get_accounts');
      const orgs = (accounts || []).filter((a: any) => !a.personal_account && a.account_id !== authUser.id);
      setOrganizations(orgs);

      const { data: projectsData } = await supabase.from('projects').select('id, name, favicon');
      setProjects(projectsData || []);

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading || !user) return null;

  return (
    <NavigationMenu organizations={organizations} projects={projects} user={user} selected={selected} />
  );
}

export default Navigation;
