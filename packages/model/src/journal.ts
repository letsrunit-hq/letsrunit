import { connect } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type Journal, type JournalEntry, type JournalEntryData, JournalEntrySchema } from './types';
import type { UUID } from 'node:crypto';
import { fromData } from './utils/convert';

function isScreenshot(name: string): boolean {
  return !!name.match(/(^|\/)screenshot-[\w\-].png$/);
}

export async function getJournal(runId: UUID, opts: { supabase?: SupabaseClient } = {}): Promise<Journal> {
  const supabase = opts.supabase ?? connect();
  const entryFromData = fromData(JournalEntrySchema);

  const { data, error } = await supabase
    .from('journal_entries')
    .select()
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) {
    return { runId, entries: [] };
  }

  const raw = (data ?? []) as unknown as JournalEntryData[];

  const result: JournalEntry[] = [];
  const prepareEntries = new Map<string, number>();

  for (const e of raw) {
    const item = entryFromData(e);
    item.artifacts = (item.artifacts ?? []).filter((a) => !!a.url && isScreenshot(a.name));

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
        result[idx] = item;
        prepareEntries.delete(e.message);
        continue;
      }
    }

    result.push(item);
  }

  return { runId, entries: result };
}
