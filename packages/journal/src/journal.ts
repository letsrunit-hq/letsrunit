import { JournalBatch } from './journal-batch';
import { NoSink } from './sink';
import type { JournalEntry, Sink } from './types';

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
    metaFn?: (result: T) => { meta?: Record<string, any>; artifacts?: File[] },
  ): Promise<T> {
    try {
      await this.start(message);

      const result = await callback();

      const { meta, artifacts } = metaFn?.(result) ?? {};
      await this.success(message, { meta, artifacts });

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

  async start(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'start' });
  }

  async success(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'success' });
  }

  async failure(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, type: 'failure' });
  }
}
