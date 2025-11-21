'use client';

import React from 'react';
import { AnimatedBackground } from '@/components/waiting-background';
import { Button } from 'primereact/button';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="p-3 center">
      <AnimatedBackground />
      <hgroup className="relative z-1 text-center text-500 pb-4">
        <h1 style={{ fontSize: '3.6em', margin: 0 }} className='text-primary'>500</h1>
        <h2 className="my-2">An unexpected error occurred</h2>
        <Button label="Retry" onClick={reset} size="small" className="mt-4" />
      </hgroup>
    </main>
  );
}
