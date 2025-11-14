import React from 'react';
import { getJournal } from '@letsrunit/model';
import type { UUID } from 'node:crypto';
import { Journal } from '@/components/journal';

export default async function Page({ params }: { params: Promise<{ id: UUID }> }) {
  const { id } = await params;
  const data = await getJournal(id);

  return (
    <main className="p-3">
      <Journal data={data} />
    </main>
  );
}
