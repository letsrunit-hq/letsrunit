import { Sink } from './index';
import { JournalEntry } from '#types';

/* v8 ignore start */
export class NoSkink implements Sink {
  async publish(_entry: JournalEntry): Promise<void> {}
}
