import { cn } from '@letsrunit/utils';
import { Chip, type ChipProps } from 'primereact/chip';
import React from 'react';

interface TileProps extends ChipProps {
  size?: 'xs' | 'sm' | 'md';
  severity?: 'info' | 'success' | 'warn' | 'error';
}

export function Tile({ className, size, severity, ...props }: TileProps) {
  return <Chip className={cn('tile', size && `tile-${size}`, severity && `tile-${severity}`, className)} {...props} />;
}

export default Tile;
