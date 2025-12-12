import type { UUID } from 'node:crypto';
import { connect } from './supabase';
import {
  type Artifact,
  type Journal,
  type JournalEntry,
  type JournalEntryData,
  JournalEntrySchema,
  type ReadOptions,
} from './types';
import { fromData } from './utils/convert';
import { DBError } from './utils/db-error';

function isScreenshot(artifact: Artifact): boolean {
  return Boolean(artifact.url && artifact.name.match(/^screenshot-[\w\-]+\.(png|je?pg|webp)$/));
}

export async function getJournal(runId: UUID, opts: ReadOptions = {}): Promise<Journal> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase
    .from('journal_entries')
    .select<'journal_entries', JournalEntryData>()
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) throw new DBError(status, error);

  return journalFromData(runId, data);
}

export function journalFromData(runId: UUID, raw: JournalEntryData[]): Journal {
  const entryFromData = fromData(JournalEntrySchema);

  const result: JournalEntry[] = [];
  const prepareEntries = new Map<string, number>();

  for (const e of raw) {
    const item = entryFromData(e);

    if (item.type === 'title') {
      prepareEntries.clear();
    }

    if (item.type === 'start' || item.type === 'success' || item.type === 'failure') {
      const idx = prepareEntries.get(e.message);

      // Replace earlier prepare entry instead of appending the entry
      if (idx !== undefined) {
        const prev = result[idx];
        // Duration only when replacing a start with success/failure
        if ((item.type === 'success' || item.type === 'failure') && prev.type === 'start') {
          item.duration = item.createdAt.getTime() - prev.createdAt.getTime();
        }

        // Shallow merge meta and artifacts
        const mergedMeta = { ...(prev.meta ?? {}), ...(item.meta ?? {}) } as any;
        const mergedArtifacts = [...(prev.artifacts ?? []), ...(item.artifacts ?? [])];

        const merged = { ...item, meta: mergedMeta, artifacts: mergedArtifacts } as JournalEntry;

        // Use the screenshot of the later entry
        merged.screenshot = item.artifacts.find((a) => isScreenshot(a)) ?? prev.screenshot;

        result[idx] = merged;

        // Maintain mapping only if the current item is still a start; otherwise remove it
        if (item.type === 'start') {
          // keep the mapping to allow final success/failure overwrite later
          prepareEntries.set(e.message, idx);
        } else {
          prepareEntries.delete(e.message);
        }
        continue;
      }
    }

    if (item.type === 'start' || item.type === 'prepare') {
      prepareEntries.set(item.message, result.length);
    }

    // compute screenshot for non-replaced item
    item.screenshot = (item.artifacts ?? []).find((a) => isScreenshot(a));
    result.push(item);
  }

  return { runId, entries: result };
}
