import { cn } from '@letsrunit/utils';
import React from 'react';

export type TileProps = {
  className?: string;
  children: React.ReactNode;
};

export function Tile({ className, children }: TileProps) {
  return (
    <div
      className={cn(
        'align-items-center justify-content-center w-4rem h-4rem border-round-xl shadow-4',
        className,
        className?.includes('hidden') ? '' : 'inline-flex',
      )}
      style={{ background: 'linear-gradient(135deg, #f97316 0%, #d97706 100%)' }}
    >
      {children}
    </div>
  );
}

export default Tile;
