'use client';

import { cn } from '@letsrunit/utils';
import { Clock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import React from 'react';

export function GuestModeBanner({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden border-round-xl border-1 border-primary-subtle bg-primary-subtle py-3 px-4', className)}>
      {/* Subtle animated gradient overlay */}
      <motion.div
        className="absolute inset-0 z-10"
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

      <div className="relative flex align-items-center gap-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-3rem h-3rem border-round-lg border-1 border-primary-subtle flex align-items-center justify-content-center"
          style={{
            background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.2))',
          }}
        >
          <Sparkles size={20} className="text-primary-400" />
        </div>

        {/* Content */}
        <div className="flex-1 white-space-nowrap overflow-hidden text-overflow-ellipsis">
          <div className="flex align-items-center gap-2 mb-1">
            <span className="text-white font-medium">You're in guest mode</span>
            <span className="flex align-items-center gap-2 text-sm text-primary-400">
              <Clock size={14} />
              <span>Expires in 24 hours</span>
            </span>
          </div>
          <p className="text-400 text-sm m-0">
            Your project is temporary. Create a free account to save it forever and unlock team features.
          </p>
        </div>

        {/* Actions */}
        <div className="flex align-items-center gap-3">
          <Link href="/auth/signup">
            <Button label="Create Account" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default GuestModeBanner;
