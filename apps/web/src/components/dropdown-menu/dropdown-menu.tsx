import Link from 'next/link';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { MenuItem, type MenuItemOptions } from 'primereact/menuitem';
import React, { useMemo, useRef, useState } from 'react';
import Chevron from '../chevron/chevron';

export type DropdownMenuProps = {
  className?: string;
  title?: string;
  model: MenuItem[];
  variant?: 'full' | 'icon';
  selectedItem?: {
    name: string;
    subtext?: string;
    icon?: React.ReactNode;
  };
};

const mapMenuItem = (item: MenuItem): MenuItem => {
  if (item.url && !item.template) {
    return {
      ...item,
      template: (item: MenuItem, options: MenuItemOptions) => (
        <div className="p-menuitem-content">
          <Link href={item.url!} className={options.className} target={item.target} onClick={options.onClick}>
            {item.icon && <span className={options.iconClassName}>{item.icon}</span>}
            <span className={options.labelClassName}>{item.label}</span>
          </Link>
        </div>
      ),
    };
  }

  if (item.items) {
    return {
      ...item,
      items: item.items.map((subItems) =>
        Array.isArray(subItems) ? subItems.map(mapMenuItem) : mapMenuItem(subItems),
      ) as MenuItem[] | MenuItem[][],
    };
  }

  return item;
};

export function DropdownMenu({ className, title, model, variant = 'full', selectedItem }: DropdownMenuProps) {
  const menu = useRef<Menu>(null);
  const [visible, setVisible] = useState(false);

  const enhancedModel = useMemo(() => model.map(mapMenuItem), [model]);

  const toggle = (event: React.MouseEvent | React.KeyboardEvent) => {
    menu.current?.toggle(event);
  };

  return (
    <>
      <Menu
        className="w-16rem"
        model={enhancedModel}
        popup
        ref={menu}
        onShow={() => setVisible(true)}
        onHide={() => setVisible(false)}
      />
      <Button type="button" onClick={toggle} className={className} title={title} text severity="contrast">
        {selectedItem && (selectedItem.icon ?? <Avatar label={selectedItem.name.charAt(0)} />)}
        {selectedItem && variant === 'full' && (
          <div className="flex-1 text-left overflow-hidden">
            <div className="white-space-nowrap overflow-hidden text-overflow-ellipsis font-medium text-sm">
              {selectedItem?.name}
            </div>
            {selectedItem?.subtext && (
              <div className="white-space-nowrap overflow-hidden text-overflow-ellipsis text-xs">
                {selectedItem.subtext}
              </div>
            )}
          </div>
        )}
        {variant === 'full' && <Chevron width="1rem" height="1rem" open={visible} />}
      </Button>
    </>
  );
}

export default DropdownMenu;
