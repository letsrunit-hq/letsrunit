import type { JournalEntry } from '#types';

export interface Sink {
  publish(entry: JournalEntry): Promise<void>
}
