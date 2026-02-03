'use client';

import { Tile } from '@/components/tile';
import { Clock, UserX } from 'lucide-react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import React from 'react';
import { ShimmerPanel } from '../shimmer-panel';

export function GuestModeBanner({ className }: { className?: string }) {
  return (
    <ShimmerPanel className={className}>
      <div className="relative flex flex-column md:flex-row align-items-center column-gap-4 row-gap-3">
        {/* Icon */}
        <Tile
          className="hidden md:flex"
          style={{ background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.2))' }}
          icon={<UserX size={20} className="text-primary-400" />}
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-column md:flex-row align-items-center row-gap-0 column-gap-2 mb-1">
            <span className="text-white font-medium">You're in guest mode</span>
            <span className="flex align-items-center gap-2 text-sm text-primary-400">
              <Clock size={14} />
              <span>Expires in 24 hours</span>
            </span>
          </div>
          <p className="text-400 text-sm m-0 hidden md:block">
            Your project is temporary. Create a free account to save it forever.
          </p>
        </div>

        {/* Actions */}
        <div className="flex align-items-center gap-3">
          <Link href="/auth/signup">
            <Button label="Create Account" />
          </Link>
        </div>
      </div>
    </ShimmerPanel>
  );
}

export default GuestModeBanner;
