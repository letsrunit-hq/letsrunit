import { AnimatedBackground } from '@/components/animated-background';
import React from 'react';

export default async function NotFoundPage() {
  return (
    <main className="p-3 center">
      <AnimatedBackground />
      <hgroup className="relative z-1 text-center text-500 pb-4">
        <h1 style={{ fontSize: '3.8em', margin: 0, lineHeight: 1 }} className="text-primary">
          404
        </h1>
        <h2 style={{ margin: 0 }}>Not Found</h2>
      </hgroup>
    </main>
  );
}
