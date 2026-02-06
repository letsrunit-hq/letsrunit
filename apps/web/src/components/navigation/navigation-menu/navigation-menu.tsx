'use client';

import { Chevron } from '@/components/chevron';
import { DropdownMenu } from '@/components/dropdown-menu';
import type { Organization, UserInfo } from '@/components/navigation';
import { Tile } from '@/components/tile';
import type { Selected } from '@/hooks/use-selected';

import { useWindowSize } from '@/hooks/use-window-size';
import type { Project } from '@letsrunit/model';
import { cn } from '@letsrunit/utils';
import { Building2, History, LayoutDashboard, LogOut, Plus, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import React, { useEffect, useState } from 'react';

export interface NavigationMenuProps {
  organizations: Organization[];
  projects: Pick<Project, 'id' | 'name' | 'favicon'>[];
  user: UserInfo;
  selected: Selected;
  className?: string;
}

export function NavigationMenu({ organizations, projects, user, selected, className }: NavigationMenuProps) {
  const { width } = useWindowSize();
  const [navState, setNavState] = useState<'expanded' | 'collapsing' | 'collapsed'>('collapsed');

  useEffect(() => {
    if (width === undefined) return;
    setNavState(width < 1440 ? 'collapsed' : 'expanded');
  }, [width]);

  const isCollapsed = navState === 'collapsed';
  const isExpandingOrExpanded = navState === 'expanded' || navState === 'collapsing';

  const selectedOrg = organizations.find((o) => o.account_id === selected.org);
  const selectedProject = projects.find((p) => p.id === selected.project);

  const isActive = (id: string) => selected.page === id;

  const handleToggle = () => {
    setNavState((prev) => (prev === 'collapsed' ? 'expanded' : 'collapsing'));
  };

  const onTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName === 'width' && e.target === e.currentTarget) {
      if (navState === 'collapsing') {
        setNavState('collapsed');
      }
    }
  };

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
      disabled: true,
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
      url: '/',
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
          'p-menuitem-link flex align-items-center gap-3 px-3 py-2-5 border-round-lg white-space-nowrap w-full',
          isCollapsed ? 'justify-content-center' : '',
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <span className={cn('p-menuitem-icon', active && 'p-highlight')}>{item.icon}</span>
        {isExpandingOrExpanded && <span className={cn('p-menuitem-text', active && 'p-highlight')}>{item.label}</span>}
      </Link>
    );
  };

  const navMenuItems: MenuItem[] = [
    {
      template: () => (
        <DropdownMenu
          model={orgMenuItems}
          className={cn(
            'w-full flex align-items-center gap-3 py-2-5 border-round-lg',
            isCollapsed ? 'justify-content-center px-0' : '',
          )}
          title={selectedOrg?.name || 'Personal'}
          variant={isCollapsed ? 'icon' : 'full'}
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
              'w-full flex align-items-center gap-3 py-2-5 border-round-lg transition-colors group',
              isCollapsed ? 'justify-content-center px-0' : '',
            )}
            title={selectedProject.name || 'unnamed'}
            variant={isCollapsed ? 'icon' : 'full'}
            selectedItem={{
              name: selectedProject.name || 'unnamed',
              icon: selectedProject.favicon ? <Tile size="xs" image={selectedProject.favicon} /> : undefined,
            }}
          />
        ) : null,
    },
    {
      id: 'project',
      label: 'Dashboard',
      icon: <LayoutDashboard />,
      url: selected.project ? `/projects/${selected.project}` : '#',
      template: renderItem,
      visible: !!selectedProject,
    },
    {
      id: 'project/runs',
      label: 'Run History',
      icon: <History />,
      url: selected.project ? `/projects/${selected.project}/runs` : '#',
      template: renderItem,
      visible: !!selectedProject,
    },
    {
      id: 'project/settings',
      label: 'Project Settings',
      icon: <Settings />,
      url: selected.project ? `/projects/${selected.project}/settings` : '#',
      template: renderItem,
      visible: !!selectedProject,
    },
  ];

  return (
    <aside
      className={cn(
        'h-screen transition-all transition-duration-300 transition-ease-in-out p-3',
        navState === 'expanded' ? 'w-18rem' : 'w-5rem collapsed',
        className,
      )}
      onTransitionEnd={onTransitionEnd}
    >
      <div className="w-full h-full overflow-hidden">
        <div className={cn('flex flex-column h-full', isCollapsed ? 'w-full' : 'w-16rem')}>
          <Menu
            model={navMenuItems}
            className="w-full h-full border-none bg-transparent flex flex-column py-0 overflow-y-auto"
          />

          {!user.isAnonymous && (
            <DropdownMenu
              model={userMenuItems}
              className={cn(
                'w-full flex align-items-center gap-3 py-2-5 border-round-lg transition-colors',
                isCollapsed ? 'justify-content-center px-0' : '',
              )}
              title={user.name}
              variant={isCollapsed ? 'icon' : 'full'}
              selectedItem={{
                name: user.name,
                subtext: user.email,
                icon: <Avatar icon={<User width="1rem" />} />,
              }}
            />
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button onClick={handleToggle} className="collapse-toggle">
        <Chevron open={navState === 'expanded'} direction="horizontal" width="0.75rem" height="0.75rem" />
      </button>
    </aside>
  );
}
