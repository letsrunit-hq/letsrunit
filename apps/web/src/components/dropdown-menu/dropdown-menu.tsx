import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import React, { useRef } from 'react';

export type DropdownMenuProps = {
  className?: string;
  model: MenuItem[];
  trigger: (toggle: (event: React.MouseEvent | React.KeyboardEvent) => void) => React.ReactNode;
};

export function DropdownMenu({ className, model, trigger }: DropdownMenuProps) {
  const menu = useRef<Menu>(null);

  const toggle = (event: React.MouseEvent | React.KeyboardEvent) => {
    menu.current?.toggle(event);
  };

  return (
    <>
      <Menu model={model} popup ref={menu} className={className} />
      {trigger(toggle)}
    </>
  );
}

export default DropdownMenu;
