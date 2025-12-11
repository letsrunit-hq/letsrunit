import { cn } from '@letsrunit/utils';
import React from 'react';
import styles from './subtle-header.module.css';

export type SubtleHeaderProps = {
  className?: string;
  children?: React.ReactNode;
};

export function SubtleHeader({ className, children }: SubtleHeaderProps) {
  return (
    <div className={cn('flex align-items-center gap-2', className)}>
      <div className={styles.lineIn} />
      <span>{children}</span>
      <div className={styles.lineOut} />
    </div>
  );
}

export default SubtleHeader;
