import type { Sink } from '../types';

/* v8 ignore start */
export class NoSink implements Sink {
  async publish(): Promise<void> {}
}
