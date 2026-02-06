'use client';

import { BottomTabMenu } from '@/components/bottom-tab-menu/bottom-tab-menu';
import { MobileNavBar } from '@/components/navigation/mobile-nav-bar/mobile-nav-bar';
import { MobileProjectMenu } from '@/components/navigation/mobile-project-menu/mobile-project-menu';
import { NavigationMenu } from '@/components/navigation/navigation-menu/navigation-menu';
import type { Organization, UserInfo } from '@/components/navigation/types';
import { useSelected } from '@/hooks/use-selected';
import { useWindowSize } from '@/hooks/use-window-size';
import { getUser, isLoggedIn, logout } from '@/libs/auth';
import { connect } from '@/libs/supabase/browser';
import { type Project } from '@letsrunit/model';
import { History, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { Sidebar } from 'primereact/sidebar';
import React, { useEffect, useState } from 'react';

export function Navigation() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name' | 'favicon'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);

  const selected = useSelected();
  const { width } = useWindowSize();
  const router = useRouter();
  const pathname = usePathname();

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

  const handleLogout = async () => {
    await logout({ supabase: connect() });
    window.location.href = '/';
  };

  if (loading || !user) return null;

  const selectedOrg = organizations.find((o) => o.account_id === selected.org);
  const selectedProject = projects.find((p) => p.id === selected.project);

  const userMenuItems: MenuItem[] = [
    {
      label: 'Settings',
      icon: <Settings size={20} className="mr-2" />,
      command: () => {
        router.push('/settings');
        setSidebarVisible(false);
      },
    },
    {
      label: 'Log out',
      icon: <LogOut size={20} className="mr-2" />,
      command: () => {
        void handleLogout();
        setSidebarVisible(false);
      },
    },
  ];

  const bottomTabItems: MenuItem[] = [];
  if (selected.project) {
    bottomTabItems.push(
      {
        label: 'Dashboard',
        icon: <LayoutDashboard />,
        command: () => router.push(`/projects/${selected.project}`),
      },
      {
        label: 'History',
        icon: <History />,
        command: () => router.push(`/projects/${selected.project}/runs`),
      },
      {
        label: 'Settings',
        icon: <Settings />,
        command: () => router.push(`/projects/${selected.project}/settings`),
      },
    );
  } else if (selected.org || window.location.pathname.startsWith('/projects')) {
    bottomTabItems.push(
      {
        label: 'Projects',
        icon: <LayoutDashboard />,
        command: () => router.push(selected.org ? `/org/${selected.org}/projects` : '/projects'),
      },
      {
        label: 'Settings',
        icon: <Settings />,
        command: () => router.push(selected.org ? `/org/${selected.org}/settings` : '/settings'),
      },
    );
  }

  const activeTabIndex = bottomTabItems.findIndex((item) => {
    return (
      (item.label === 'Dashboard' && pathname.endsWith(selected.project!)) ||
      (item.label === 'History' && pathname.endsWith('/runs')) ||
      (item.label === 'Settings' && pathname.endsWith('/settings')) ||
      (item.label === 'Projects' && pathname.endsWith('/projects'))
    );
  });

  if (width !== undefined && width < 1024) {
    return (
      <>
        <MobileNavBar
          selectedProject={selectedProject}
          selectedOrgName={selectedOrg?.name}
          onMenuClick={() => setSidebarVisible(true)}
          onProjectClick={() => setProjectMenuVisible(true)}
          isAnonymous={user.isAnonymous}
          className="lg:hidden"
        />
        <Sidebar
          visible={sidebarVisible}
          onHide={() => setSidebarVisible(false)}
          position="right"
          className="w-18rem p-0"
        >
          <div className="flex flex-column h-full">
            <div className="p-4 border-bottom-1 border-subtle">
              <div className="font-bold text-xl">{user.name}</div>
              <div className="text-color-secondary">{user.email}</div>
            </div>
            <Menu
              model={userMenuItems}
              className="w-full border-none"
              pt={{
                menuitem: { className: 'p-0' },
                action: { className: 'p-menuitem-link' },
              }}
            />
          </div>
        </Sidebar>
        <Sidebar
          visible={projectMenuVisible}
          onHide={() => setProjectMenuVisible(false)}
          position="top"
          className="h-auto p-0"
          showCloseIcon={false}
          pt={{ header: { className: 'hidden'}, content: { className: 'pt-2' } }}
        >
          <MobileProjectMenu
            organizations={organizations}
            projects={projects}
            onItemClick={() => setProjectMenuVisible(false)}
          />
        </Sidebar>
        {bottomTabItems.length > 0 && <BottomTabMenu model={bottomTabItems} activeIndex={activeTabIndex} />}
      </>
    );
  }

  return (
    <NavigationMenu
      organizations={organizations}
      projects={projects}
      user={user}
      selected={selected}
      className="hidden lg:block fixed left-0 top-0"
    />
  );
}

export default Navigation;
