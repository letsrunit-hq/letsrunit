import { ChevronDown } from 'lucide-react';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import React, { useRef } from 'react';

export type DropdownMenuProps = {
  className?: string;
  title?: string;
  model: MenuItem[];
  variant?: 'full' | 'icon';
  selectedItem?: {
    name: string;
    subtext?: string;
    icon?: React.ReactNode;
    image?: string;
  };
};

export function DropdownMenu({ className, title, model, variant = 'full', selectedItem }: DropdownMenuProps) {
  const menu = useRef<Menu>(null);

  const toggle = (event: React.MouseEvent | React.KeyboardEvent) => {
    menu.current?.toggle(event);
  };

  const renderContent = () => {
    if (variant === 'icon') {
      if (selectedItem?.icon) return selectedItem.icon;
      if (selectedItem?.image) {
        return (
          <div className="avatar">
            <span>{selectedItem.name.charAt(0)}</span>
          </div>
        );
      }
      return null;
    }

    return (
      <>
        {selectedItem?.icon && selectedItem.icon}
        {selectedItem?.image && (
          <div className="avatar">
            <span>{selectedItem.name.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 text-left overflow-hidden">
          <div className="white-space-nowrap overflow-hidden text-overflow-ellipsis font-medium text-sm">{selectedItem?.name}</div>
          {selectedItem?.subtext && <div className="white-space-nowrap overflow-hidden text-overflow-ellipsis text-xs">{selectedItem.subtext}</div>}
        </div>
        <ChevronDown style={{ width: '1rem', height: '1rem' }} />
      </>
    );
  };

  return (
    <>
      <Menu model={model} popup ref={menu} />
      <button type="button" onClick={toggle} className={className} title={title}>
        {renderContent()}
      </button>
    </>
  );
}

export default DropdownMenu;
