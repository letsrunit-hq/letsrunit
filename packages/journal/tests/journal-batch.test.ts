import { describe, expect, it, vi } from 'vitest';
import type { JournalEntry, Sink } from '../src';
import { JournalBatch } from '../src/journal-batch';

class DummySink implements Sink {
  public readonly calls: JournalEntry[][] = [];

  async publish(...entries: JournalEntry[]): Promise<void> {
    this.calls.push(entries);
  }
}

describe('JournalBatch', () => {
  it('chains methods and flushes collected entries', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1_725_000_000_000));
    const sink = new DummySink();
    const batch = new JournalBatch(sink);

    batch
      .debug('d')
      .info('i')
      .title('t')
      .warn('w')
      .error('e')
      .prepare('p')
      .success('s')
      .failure('f');

    await batch.flush();

    expect(sink.calls).toHaveLength(1);
    expect(sink.calls[0].map((e) => e.type)).toEqual([
      'debug', 'info', 'title', 'warn', 'error', 'prepare', 'success', 'failure',
    ]);
    expect(sink.calls[0].every((e) => e.timestamp === 1_725_000_000_000)).toBe(true);
    vi.useRealTimers();
  });

  it('skips undefined messages and supports each()', async () => {
    const sink = new DummySink();
    const batch = new JournalBatch(sink);

    const returned = batch
      .info(undefined)
      .each(['a', 'b'], (j, item) => j.info(item))
      .warn(undefined)
      .error('boom');

    expect(returned).toBe(batch);
    await batch.flush();

    expect(sink.calls[0].map((e) => `${e.type}:${e.message}`)).toEqual([
      'info:a',
      'info:b',
      'error:boom',
    ]);
  });
});
