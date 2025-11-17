'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useRun } from '@/hooks/use-run';
import { Journal as JournalView } from '@/components/journal';
import { WaitingBackground } from '@/components/waiting-background';
import { QueueStatus } from '@/components/queue-status';
import styles from './page.module.css';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { run, journal, loading, error } = useRun(id);

  if (loading) return <main className="p-3">Loading…</main>;
  if (error) return <main className="p-3">Error: {error}</main>;

  if (run?.status === 'queued') {
    return (
      <main className={`p-3 ${styles.center}`}>
        <WaitingBackground />
        <QueueStatus />
      </main>
    );
  }

  return (
    <main className="p-3">
      {journal && <JournalView data={journal} />}
    </main>
  );
}
