'use client';

import { DropdownMenu } from '@/components/dropdown-menu';
import { cn } from '@letsrunit/utils';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import React, { useState } from 'react';

export interface Project {
  id: string;
  name: string;
}

export interface Organization {
  account_id: string;
  name: string;
}

export interface UserInfo {
  name: string;
  email: string;
}

export interface NavigationMenuProps {
  organizations: Organization[];
  projects: Project[];
  selectedOrg: Organization;
  selectedProject: Project;
  user: UserInfo;
}

export function NavigationMenu({ organizations, projects, selectedOrg, selectedProject, user }: NavigationMenuProps) {
  const [collapsed, setCollapsed] = useState(false);

  const pathname = usePathname();
  const { projectId } = useParams() as { projectId?: string };

  const isActive = (path: string) => {
    if (path === 'dashboard')
      return pathname.includes('/project/') && !pathname.includes('/history') && !pathname.includes('/settings');
    if (path === 'history') return pathname.includes('/history');
    if (path === 'settings') return pathname.includes('/settings');
    if (path === 'org-settings') return pathname.includes('/org/') && pathname.includes('/settings');
    return false;
  };

  const isAnyActive = (paths: string[]) => paths.some(isActive);

  const orgMenuItems: MenuItem[] = [
    {
      label: 'Organizations',
    },
    ...organizations.map((org) => ({
      label: org.name,
      icon: <Building2 className="mr-2" />,
      command: () => {
        /* handle org change */
      },
    })),
    { separator: true },
    {
      label: 'Create organization',
      icon: <Plus className="mr-2" />,
      command: () => {
        /* handle create */
      },
    },
  ];

  const projectMenuItems: MenuItem[] = [
    {
      label: 'All Projects',
    },
    { separator: true },
    {
      label: 'Projects',
    },
    ...projects.map((project) => ({
      label: project.name,
      command: () => {
        /* handle project change */
      },
    })),
    { separator: true },
    {
      label: 'Create new project',
      icon: <Plus className="mr-2" />,
      command: () => {
        /* handle create */
      },
    },
  ];

  const userMenuItems: MenuItem[] = [
    {
      label: 'User Settings',
      icon: <Settings className="mr-2" />,
      command: () => {
        /* handle navigate */
      },
    },
    {
      label: 'Sign out',
      icon: <LogOut className="mr-2" />,
      command: () => {
        /* handle sign out */
      },
    },
  ];

  const renderItem = (item: MenuItem) => {
    const active = item.id ? isActive(item.id) : false;

    return (
      <Link
        href={item.url || '#'}
        className={cn(
          'p-menuitem-link flex align-items-center gap-3 px-3 py-2-5 border-round-lg',
          collapsed ? 'justify-content-center' : '',
        )}
        title={collapsed ? item.label : undefined}
      >
        <span className={cn('p-menuitem-icon', active && 'p-highlight')}>
          {item.icon}
        </span>
        {!collapsed && (
          <span className={cn('p-menuitem-text', active && 'p-highlight')}>
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  const navMenuItems: MenuItem[] = [
    {
      template: () => (
        <div className="h-4rem flex align-items-center px-4">
          <DropdownMenu
            model={orgMenuItems}
            className={cn(
              'w-full flex align-items-center gap-3 px-3 py-2-5 border-round-lg transition-colors',
              collapsed ? 'justify-content-center' : '',
            )}
            title={selectedOrg.name}
            variant={collapsed ? 'icon' : 'full'}
            selectedItem={{
              name: selectedOrg.name,
              icon: <Building2 />,
            }}
          />
        </div>
      ),
    },
    {
      id: 'org-settings',
      label: 'Organization Settings',
      icon: <Settings />,
      url: `/org/${selectedOrg.account_id}/settings`,
      template: renderItem,
    },
    {
      template: () => <div className="px-4 py-2"><div className="border-bottom-1" /></div>,
    },
    {
      template: () => (
        <div className="p-4">
          <DropdownMenu
            model={projectMenuItems}
            className={cn(
              'w-full flex align-items-center gap-3 px-3 py-2-5 border-round-lg transition-colors group',
              collapsed ? 'justify-content-center' : '',
            )}
            title={selectedProject.name}
            variant={collapsed ? 'icon' : 'full'}
            selectedItem={{
              name: selectedProject.name,
              subtext: selectedOrg.name,
              image: selectedProject.name,
            }}
          />
        </div>
      ),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard />,
      url: `/project/${projectId || '1'}`,
      template: renderItem,
    },
    {
      id: 'history',
      label: 'Run History',
      icon: <History />,
      url: `/project/${projectId || '1'}/history`,
      template: renderItem,
    },
    {
      id: 'settings',
      label: 'Project Settings',
      icon: <Settings />,
      url: `/project/${projectId || '1'}/settings`,
      template: renderItem,
    },
    {
      template: () => <div className="flex-grow-1" />,
    },
    {
      template: () => (
        <div className="p-4">
          <DropdownMenu
            model={userMenuItems}
            className={cn(
              'w-full flex align-items-center gap-3 px-3 py-2-5 border-round-lg transition-colors',
              collapsed ? 'justify-content-center' : '',
            )}
            title={collapsed ? user.name : undefined}
            variant={collapsed ? 'icon' : 'full'}
            selectedItem={{
              name: user.name,
              subtext: user.email,
              icon: (
                <div className="avatar">
                  <User style={{ width: '1rem', height: '1rem' }} />
                </div>
              ),
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-column h-screen fixed left-0 top-0 transition-all transition-duration-300 transition-ease-in-out',
        collapsed ? 'w-5rem' : 'w-18rem',
      )}
    >
      <Menu
        model={navMenuItems}
        className="w-full h-full border-none bg-transparent flex flex-column py-0 overflow-y-auto"
      />

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="collapse-toggle"
      >
        {collapsed ? (
          <ChevronRight style={{ width: '0.75rem', height: '0.75rem' }} />
        ) : (
          <ChevronLeft style={{ width: '0.75rem', height: '0.75rem' }} />
        )}
      </button>
    </aside>
  );
}
