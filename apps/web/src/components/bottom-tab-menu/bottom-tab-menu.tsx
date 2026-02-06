'use client';

import { cn } from '@letsrunit/utils';
import { MenuItem } from 'primereact/menuitem';
import { TabMenu } from 'primereact/tabmenu';
import React from 'react';

export interface BottomTabMenuProps {
  model: MenuItem[];
  activeIndex?: number;
  onTabChange?: (e: { index: number }) => void;
  className?: string;
}

export function BottomTabMenu({ model, activeIndex, onTabChange, className }: BottomTabMenuProps) {
  return (
    <div
      className={cn('fixed bottom-0 left-0 right-0 border-top-1 border-subtle bg-subtle z-5 lg:hidden', className)}
    >
      <TabMenu
        model={model}
        activeIndex={activeIndex}
        onTabChange={(e) => onTabChange?.(e)}
        unstyled
        pt={{
          root: { className: 'flex justify-content-around' },
          menu: { className: 'flex list-none p-0 m-0 w-full' },
          menuitem: { className: 'flex-1' },
          action: ({ context }: any) => ({
            className: cn(
              'flex flex-column align-items-center justify-content-center gap-1 p-2 no-underline transition-colors duration-200',
              context.active ? 'text-primary' : 'text-color-secondary hover:text-color',
            ),
          }),
          icon: { className: 'text-xl' },
          label: { className: 'text-xs' },
        }}
      />
    </div>
  );
}

export default BottomTabMenu;
