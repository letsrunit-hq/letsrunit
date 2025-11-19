import type { JournalEntry, Sink } from './types';
import { NoSink } from './sink';
import { JournalBatch } from './journal-batch';

type Options = Partial<Pick<JournalEntry, 'artifacts' | 'meta'>>;

export class Journal<TSink extends Sink = Sink> {
  constructor(readonly sink: TSink) {}

  static nil() {
    return new Journal(new NoSink());
  }

  async log(message: string, options: Options & { type: JournalEntry['type'] }): Promise<void> {
    const entry: JournalEntry = {
      timestamp: Date.now(),
      message,
      type: options.type,
      artifacts: options.artifacts ?? [],
      meta: options.meta ?? {},
    };

    await this.sink.publish(entry);
  }

  batch() {
    return new JournalBatch(this.sink);
  }

  async do<T>(
    message: string,
    callback: () => T | Promise<T>,
    metaFn?: (result: T) => Record<string, any>,
  ): Promise<T> {
    try {
      await this.prepare(message);
      const result = await callback();

      const meta = metaFn?.(result);
      await this.success(message, { meta });

      return result;
    } catch (e) {
      await this.failure(message);
      throw e;
    }
  }

  async debug(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'debug' });
  }

  async info(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'info' });
  }

  async warn(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'warn' });
  }

  async error(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'error' });
  }

  async title(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'title' });
  }

  async prepare(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'prepare' });
  }

  async success(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'success' });
  }

  async failure(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'failure' });
  }
}
