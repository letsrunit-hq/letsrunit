'use client';

import { DropdownMenu } from '@/components/dropdown-menu';
import {
  Building2,
  ChevronDown,
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
import { MenuItem } from 'primereact/menuitem';
import React, { useState } from 'react';

interface Project {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
}

const projects: Project[] = [
  { id: '1', name: 'E-commerce Platform' },
  { id: '2', name: 'Mobile App Tests' },
  { id: '3', name: 'Admin Dashboard' },
];

const organizations: Organization[] = [
  { id: '1', name: 'Acme Corp' },
  { id: '2', name: 'My Personal Workspace' },
];

export function NavigationMenu() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedProject] = useState(projects[0]);
  const [selectedOrg] = useState(organizations[0]);

  const pathname = usePathname();
  const { projectId } = useParams() as { projectId?: string };

  const isActive = (path: string) => {
    if (path === 'dashboard')
      return (
        pathname.includes('/project/') &&
        !pathname.includes('/history') &&
        !pathname.includes('/settings')
      );
    if (path === 'history') return pathname.includes('/history');
    if (path === 'settings') return pathname.includes('/settings');
    return false;
  };

  const orgMenuItems: MenuItem[] = [
    {
      label: 'Organizations',
      template: (item) => (
        <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {item.label}
        </div>
      ),
    },
    ...organizations.map((org) => ({
      label: org.name,
      icon: <Building2 className="w-4 h-4 mr-2" />,
      className: selectedOrg.id === org.id ? 'bg-orange-500/10 text-orange-400' : 'text-zinc-300',
      command: () => {
        /* handle org change */
      },
    })),
    { separator: true },
    {
      label: 'Create organization',
      icon: <Plus className="w-4 h-4 mr-2" />,
      command: () => {
        /* handle create */
      },
    },
  ];

  const projectMenuItems: MenuItem[] = [
    {
      label: 'All Projects',
      template: () => (
        <Link
          href="/projects"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors mb-2"
        >
          <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-500 to-amber-600" />
          <span className="font-medium text-sm">All Projects</span>
        </Link>
      ),
    },
    { separator: true },
    {
      label: 'Projects',
      template: (item) => (
        <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {item.label}
        </div>
      ),
    },
    ...projects.map((project) => ({
      label: project.name,
      template: () => (
        <Link
          href={`/project/${project.id}`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            selectedProject.id === project.id
              ? 'bg-orange-500/10 text-orange-400'
              : 'text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              selectedProject.id === project.id ? 'bg-orange-400' : 'bg-zinc-600'
            }`}
          />
          <span className="font-medium text-sm">{project.name}</span>
        </Link>
      ),
    })),
    { separator: true },
    {
      label: 'Create new project',
      icon: <Plus className="w-4 h-4 mr-2" />,
      command: () => {
        /* handle create */
      },
    },
  ];

  const userMenuItems: MenuItem[] = [
    {
      label: 'User Settings',
      icon: <Settings className="w-4 h-4 mr-2" />,
      template: (item) => (
        <Link
          href="/user/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">{item.label}</span>
        </Link>
      ),
    },
    {
      label: 'Sign out',
      icon: <LogOut className="w-4 h-4 mr-2 text-red-400" />,
      className: 'text-red-400',
      command: () => {
        /* handle sign out */
      },
    },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen bg-zinc-950 border-r border-zinc-800 sticky top-0 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-[280px]'
      }`}
    >
      {/* Header - Organization Dropdown */}
      <div className="h-16 flex items-center px-4">
        <DropdownMenu
          model={orgMenuItems}
          trigger={(toggle) => (
            <button
              onClick={toggle}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors ${
                collapsed ? 'justify-content-center' : ''
              }`}
              title={collapsed ? selectedOrg.name : undefined}
            >
              <Building2 className="w-5 h-5 text-zinc-400" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-sm text-white truncate font-medium">
                    {selectedOrg.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                </>
              )}
            </button>
          )}
        />
      </div>

      {/* Organization Settings */}
      <div className="px-4 pb-4 border-b border-zinc-800 text-sm">
        <Link
          href={`/org/${selectedOrg.id}/settings`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-zinc-400 hover:text-white hover:bg-zinc-900 ${
            collapsed ? 'justify-content-center' : ''
          }`}
          title={collapsed ? 'Organization Settings' : undefined}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Organization Settings</span>}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-zinc-400" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-zinc-400" />
        )}
      </button>

      {/* Project Switcher */}
      <div className="p-4">
        <DropdownMenu
          model={projectMenuItems}
          trigger={(toggle) => (
            <button
              onClick={toggle}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors group ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? selectedProject.name : undefined}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {selectedProject.name.charAt(0)}
                </span>
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="text-white font-medium text-sm truncate">
                      {selectedProject.name}
                    </div>
                    <div className="text-zinc-500 text-xs truncate">{selectedOrg.name}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                </>
              )}
            </button>
          )}
        />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto text-sm">
        <Link
          href={`/project/${projectId || '1'}`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            isActive('dashboard')
              ? 'bg-orange-500/10 text-orange-400'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Dashboard</span>}
        </Link>
        <Link
          href={`/project/${projectId || '1'}/history`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            isActive('history')
              ? 'bg-orange-500/10 text-orange-400'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Run History' : undefined}
        >
          <History className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Run History</span>}
        </Link>
        <Link
          href={`/project/${projectId || '1'}/settings`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            isActive('settings')
              ? 'bg-orange-500/10 text-orange-400'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Project Settings</span>}
        </Link>
      </nav>

      {/* Bottom Section */}
      <div className="border-zinc-800">
        {/* User Menu */}
        <div className="p-4">
          <DropdownMenu
            model={userMenuItems}
            trigger={(toggle) => (
              <button
                onClick={toggle}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors ${
                  collapsed ? 'justify-center' : ''
                }`}
                title={collapsed ? 'John Doe' : undefined}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                {!collapsed && (
                  <>
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="text-white font-medium text-sm truncate">John Doe</div>
                      <div className="text-zinc-500 text-xs truncate">john@example.com</div>
                    </div>
                  </>
                )}
              </button>
            )}
          />
        </div>
      </div>
    </aside>
  );
}
