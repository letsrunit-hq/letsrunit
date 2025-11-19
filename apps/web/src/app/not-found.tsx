import { AnimatedBackground } from '@/components/waiting-background';
import React from 'react';

export default async function NotFound() {
  return (
    <>
      <main className="p-3 center">
        <AnimatedBackground />
        <hgroup style={{ position: 'relative', zIndex: 1, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.6em', margin: 0 }}>404</h1>
          <h2 style={{ margin: '8px 0' }}>Not Found</h2>
        </hgroup>
      </main>
    </>
  );
}
