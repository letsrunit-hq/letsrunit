'use client';

import { DropdownMenu } from '@/components/dropdown-menu';
import type { Selected } from '@/libs/nav';
import type { Project } from '@letsrunit/model';
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
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import React, { useState } from 'react';
import Tile from '../tile/tile';

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
  projects: Pick<Project, 'id' | 'name' | 'favicon'>[];
  user: UserInfo;
  selected: Selected;
}

export function NavigationMenu({ organizations, projects, user, selected }: NavigationMenuProps) {
  const [collapsed, setCollapsed] = useState(false);

  const selectedOrg = organizations.find((o) => o.account_id === selected.org);
  const selectedProject = projects.find((p) => p.id === selected.project);

  const isActive = (id: string) => selected.page === id;

  const orgMenuItems: MenuItem[] = [
    {
      label: 'Personal',
      icon: <User className="mr-2" />,
      url: '/projects',
    },
    ...(organizations.length > 0
      ? [
          { separator: true },
          {
            label: 'Organizations',
            items: organizations.map((org) => ({
              label: org.name,
              icon: <Building2 className="mr-2" />,
              url: `/org/${org.account_id}/projects`,
            })),
          },
        ]
      : []),
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
    ...projects.map((project) => ({
      label: project.name ?? 'unnamed',
      url: `/projects/${project.id}`,
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
        <span className={cn('p-menuitem-icon', active && 'p-highlight')}>{item.icon}</span>
        {!collapsed && <span className={cn('p-menuitem-text', active && 'p-highlight')}>{item.label}</span>}
      </Link>
    );
  };

  const navMenuItems: MenuItem[] = [
    {
      template: () => (
        <DropdownMenu
          model={orgMenuItems}
          className={cn(
            'w-full flex align-items-center gap-3 px-3 py-2-5 border-round-lg',
            collapsed ? 'justify-content-center' : '',
          )}
          title={selectedOrg?.name || 'Personal'}
          variant={collapsed ? 'icon' : 'full'}
          selectedItem={{
            name: selectedOrg?.name || 'Personal',
            icon: selectedOrg?.name ? <Building2 /> : <User />,
          }}
        />
      ),
    },
    {
      id: 'org/settings',
      label: 'Organization Settings',
      icon: <Settings />,
      url: `/org/${selectedOrg?.account_id}/settings`,
      visible: !!selectedOrg,
      template: renderItem,
    },
    {
      visible: !!selectedProject,
      template: () => (
        <div className="py-2">
          <div className="border-bottom-1 border-subtle" />
        </div>
      ),
    },
    {
      template: () =>
        selectedProject ? (
          <DropdownMenu
            model={projectMenuItems}
            className={cn(
              'w-full flex align-items-center gap-3 px-3 py-2-5 border-round-lg transition-colors group',
              collapsed ? 'justify-content-center' : '',
            )}
            title={selectedProject.name || 'unnamed'}
            variant={collapsed ? 'icon' : 'full'}
            selectedItem={{
              name: selectedProject.name || 'unnamed',
              subtext: selectedOrg?.name || 'Personal',
              icon: selectedProject.favicon ? <Tile size="xs" image={selectedProject.favicon} /> : undefined,
            }}
          />
        ) : null,
    },
    {
      id: 'project',
      label: 'Dashboard',
      icon: <LayoutDashboard />,
      url: `/projects/${selected.project || '1'}`,
      template: renderItem,
      visible: !!selectedProject,
    },
    {
      id: 'project/runs',
      label: 'Run History',
      icon: <History />,
      url: `/projects/${selected.project || '1'}/runs`,
      template: renderItem,
      visible: !!selectedProject,
    },
    {
      id: 'project/settings',
      label: 'Project Settings',
      icon: <Settings />,
      url: `/projects/${selected.project || '1'}/settings`,
      template: renderItem,
      visible: !!selectedProject,
    },
  ];

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-column h-screen fixed left-0 top-0 transition-all transition-duration-300 transition-ease-in-out p-3',
        collapsed ? 'w-5rem' : 'w-18rem',
      )}
    >
      <Menu
        model={navMenuItems}
        className="w-full h-full border-none bg-transparent flex flex-column py-0 overflow-y-auto"
      />

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
          icon: <Avatar icon={<User width="1rem" />} />,
        }}
      />

      {/* Collapse Toggle */}
      <button onClick={() => setCollapsed(!collapsed)} className="collapse-toggle">
        {collapsed ? (
          <ChevronRight style={{ width: '0.75rem', height: '0.75rem' }} />
        ) : (
          <ChevronLeft style={{ width: '0.75rem', height: '0.75rem' }} />
        )}
      </button>
    </aside>
  );
}
