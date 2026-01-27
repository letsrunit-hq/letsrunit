import { cn } from '@letsrunit/utils';
import { Chip, type ChipProps } from 'primereact/chip';
import React from 'react';

export function Tile({ className, ...props }: ChipProps) {
  return <Chip className={cn('tile', className)} {...props} />;
}

export default Tile;
