import type { Sink, JournalEntry } from './types';

type Options = Partial<Pick<JournalEntry, 'artifacts' | 'meta'>>;

export class JournalBatch {
  private entries: JournalEntry[] = [];

  constructor(private sink: Sink) {}

  log(message: string | undefined, options: Options & { type: JournalEntry['type'] }): JournalBatch {
    if (message) {
      this.entries.push({
        timestamp: Date.now(),
        message,
        type: options.type,
        artifacts: options.artifacts ?? [],
        meta: options.meta ?? {},
      });
    }

    return this;
  }

  async flush() {
    await this.sink.publish(...this.entries);
  }

  debug(message: string | undefined, options: Options = {}): JournalBatch {
    return this.log(message, { ...options, type: 'debug' });
  }

  info(message: string | undefined, options: Options = {}): JournalBatch {
    return this.log(message, { ...options, type: 'info' });
  }

  title(message: string | undefined, options: Options = {}): JournalBatch {
    return this.log(message, { ...options, type: 'title' });
  }

  warn(message: string | undefined, options: Options = {}): JournalBatch {
    return this.log(message, { ...options, type: 'warn' });
  }

  error(message: string | undefined, options: Options = {}): JournalBatch {
    return this.log(message, { ...options, type: 'error' });
  }

  prepare(message: string | undefined, options: Options = {}): JournalBatch {
    return this.log(message, { ...options, type: 'prepare' });
  }

  success(message: string | undefined, options: Options = {}): JournalBatch {
    return this.log(message, { ...options, type: 'success' });
  }

  failure(message: string | undefined, options: Options = {}): JournalBatch {
    return this.log(message, { ...options, type: 'failure' });
  }
}
