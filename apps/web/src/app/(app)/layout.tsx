import { Navigation } from '@/components/navigation';
import React from 'react';
import styles from './layout.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main className={styles.main}>{children}</main>
    </>
  );
}
