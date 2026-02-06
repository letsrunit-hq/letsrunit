import { cn } from '@letsrunit/utils';
import { motion } from 'motion/react';
import { Button, type ButtonProps } from 'primereact/button';
import React from 'react';

export type ShimmerButtonProps = ButtonProps & {
  shimmer?: boolean;
};

export function ShimmerButton({ shimmer = true, children, className, label, ...props }: ShimmerButtonProps) {
  const hasLabel = Boolean(label || children);

  return (
    <Button className={cn('relative overflow-hidden', className, !hasLabel && 'p-button-icon-only')} {...props}>
      {shimmer && (
        <motion.div
          data-testid="shimmer-effect"
          className="absolute top-0 left-0 bottom-0 right-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent)',
          }}
          animate={{
            x: ['-200%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      {hasLabel && (
        <div className="relative flex align-items-center justify-content-center gap-2 w-full">{label || children}</div>
      )}
    </Button>
  );
}

export default ShimmerButton;
