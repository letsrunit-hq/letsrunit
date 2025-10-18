import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Journal } from '../../src/journal/journal';
import type { Sink } from '../../src/journal/sink';
import type { JournalEntry } from '#types';

class DummySink implements Sink {
  public readonly published: JournalEntry[] = [];
  async publish(entry: JournalEntry): Promise<void> {
    this.published.push(entry);
  }
}

const FIXED_TIME = 1_725_000_000_000; // arbitrary fixed timestamp

describe('Journal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('publishes info entries with message and defaults', async () => {
    const sink = new DummySink();
    const journal = new Journal(sink);

    await journal.log('Hello world');

    expect(sink.published.length).toBe(1);
    const entry = sink.published[0];
    expect(entry.timestamp).toBe(FIXED_TIME);
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('Hello world');
  });

  it('publishes with provided artifacts and meta', async () => {
    const sink = new DummySink();
    const journal = new Journal(sink);

    const artifacts = ['file1.txt', 'image.png'];
    const meta = { a: 1, b: 'two' };
    await journal.log('Has extras', { artifacts, meta });

    const entry = sink.published[0];
    expect(entry.artifacts).toEqual(artifacts);
    expect(entry.meta).toEqual(meta);
  });

  it('sets proper level for debug/warn/error helpers', async () => {
    const sink = new DummySink();
    const journal = new Journal(sink);

    await journal.debug('d');
    await journal.info('i');
    await journal.warn('w');
    await journal.error('e');

    expect(sink.published.map((e) => e.level)).toEqual(['debug', 'info', 'warn', 'error']);
    expect(sink.published.map((e) => e.message)).toEqual(['d', 'i', 'w', 'e']);
    expect(sink.published.every((e) => e.timestamp === FIXED_TIME)).toBe(true);
  });
});
