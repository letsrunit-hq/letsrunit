import { connect } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type Artifact, type Journal, type JournalEntry, type JournalEntryData, JournalEntrySchema } from './types';
import type { UUID } from 'node:crypto';
import { fromData } from './utils/convert';

function isScreenshot(artifact: Artifact): boolean {
  return Boolean(artifact.url && artifact.name.match(/^screenshot-[\w\-]+\.(png|je?pg|webp)$/));
}

export async function getJournal(runId: UUID, opts: { supabase?: SupabaseClient } = {}): Promise<Journal> {
  const supabase = opts.supabase ?? connect();

  const { data, error } = await supabase
    .from('journal_entries')
    .select()
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) {
    return { runId, entries: [] };
  }

  const raw = (data ?? []) as unknown as JournalEntryData[];

  return journalFromData(runId, raw);
}

export function journalFromData(runId: UUID, raw: JournalEntryData[]): Journal {
  const entryFromData = fromData(JournalEntrySchema);

  const result: JournalEntry[] = [];
  const prepareEntries = new Map<string, number>();

  for (const e of raw) {
    const item = entryFromData(e);
    item.screenshot = (item.artifacts ?? []).find((a) => isScreenshot(a));

    if (item.type === 'title') {
      prepareEntries.clear();
    }

    if (item.type === 'prepare') {
      prepareEntries.set(item.message, result.length);
    }

    if (item.type === 'success' || item.type === 'failure') {
      const idx = prepareEntries.get(e.message);

      // Replace earlier prepare entry instead of appending the entry
      if (idx !== undefined) {
        item.duration = item.createdAt.getTime() - result[idx].createdAt.getTime();
        result[idx] = item;
        prepareEntries.delete(e.message);
        continue;
      }
    }

    result.push(item);
  }

  return { runId, entries: result };
}

