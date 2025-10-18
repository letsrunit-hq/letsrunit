import { Sink } from './sink';
import { JournalEntry } from '#types';

type OptionsWithLevel = Partial<Pick<JournalEntry, 'level' | 'artifacts' | 'meta'>>;
type Options = Partial<Pick<JournalEntry, 'artifacts' | 'meta'>>;

export class Journal {
  constructor(private sink: Sink) {}

  async log(message: string, options: OptionsWithLevel = {}): Promise<void> {
    const entry: JournalEntry = {
      timestamp: Date.now(),
      message,
      level: options.level ?? 'info',
      artifacts: options.artifacts ?? [],
      meta: options.meta ?? {},
    };
    await this.sink.publish(entry);
  }

  async debug(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, level: 'debug' });
  }

  async info(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, level: 'info' });
  }

  async warn(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, level: 'warn' });
  }

  async error(message: string, options: Options = {}): Promise<void> {
    await this.log(message, { ...options, level: 'error' });
  }
}
