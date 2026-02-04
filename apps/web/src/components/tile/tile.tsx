import { cn } from '@letsrunit/utils';
import { Chip, type ChipProps } from 'primereact/chip';
import React from 'react';

export function Tile({ className, size, ...props }: ChipProps & { size?: 'xs' | 'sm' | 'md' }) {
  return <Chip className={cn('tile', size && `tile-${size}`, className)} {...props} />;
}

export default Tile;
