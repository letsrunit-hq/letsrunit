'use client';

import type { Organization } from '@/components/navigation/types';
import { Tile } from '@/components/tile';
import type { Project } from '@letsrunit/model';
import { cn } from '@letsrunit/utils';
import { Building2, User } from 'lucide-react';
import Link from 'next/link';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import React from 'react';

export interface MobileProjectMenuProps {
  organizations: Organization[];
  projects: Pick<Project, 'id' | 'name' | 'favicon'>[];
  onItemClick?: () => void;
  className?: string;
}

export function MobileProjectMenu({ organizations, projects, onItemClick, className }: MobileProjectMenuProps) {
  const renderOrgItem = (item: MenuItem) => {
    if (!item.url) return;

    return (
      <Link href={item.url} className="flex align-items-center p-menuitem-link" onClick={onItemClick}>
        <span className="menu-icon">{item.icon}</span>
        <span className="mx-2">{item.label}</span>
      </Link>
    );
  };

  const renderProjectItem = (item: MenuItem) => {
    if (!item.url) return;

    const project = item.data as Pick<Project, 'id' | 'name' | 'favicon'>;
    return (
      <Link href={item.url} className="flex align-items-center p-menuitem-link" onClick={onItemClick}>
        <span className="menu-icon">
          <Tile
            size="xs"
            image={project.favicon || undefined}
            label={project.favicon ? undefined : project.name?.charAt(0).toUpperCase()}
          />
        </span>
        <span className="mx-2">{item.label}</span>
      </Link>
    );
  };

  const items: MenuItem[] = [
    {
      label: 'Personal',
      icon: <User size={20} />,
      url: '/projects',
      template: renderOrgItem,
    },
    ...organizations.map((org) => ({
      label: org.name || '-',
      icon: <Building2 size={20} />,
      url: `/org/${org.account_id}/projects`,
      template: renderOrgItem,
    })),
    { separator: true },
    ...projects.map((project) => ({
      label: project.name || 'unnamed',
      url: `/projects/${project.id}`,
      data: project,
      template: renderProjectItem,
    })),
  ];

  return <Menu model={items} unstyled className={cn(className, 'seamless-menu')} style={{ width: '100%', border: 'none' }} />;
}

export default MobileProjectMenu;
