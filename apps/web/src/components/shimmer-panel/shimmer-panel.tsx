import { cn } from '@letsrunit/utils';
import { motion } from 'motion/react';
import type { PanelProps } from 'primereact/panel';
import { Panel } from 'primereact/panel';
import React from 'react';

export type ShimmerPanelProps = PanelProps;

export function ShimmerPanel({ className, children, ...props }: ShimmerPanelProps) {
  return (
    <Panel
      className={cn(
        'relative overflow-hidden border-round-xl border-1 border-primary-subtle bg-primary-subtle',
        className,
      )}
      {...props}
    >
      {/* Subtle animated gradient overlay */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          top: 0,
          height: '100%',
          width: '100%',
          background: 'linear-gradient(to right, transparent, rgba(245, 158, 11, 0.05), transparent)',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {children}
    </Panel>
  );
}

export default ShimmerPanel;
