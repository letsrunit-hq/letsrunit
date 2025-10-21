import { describe, it, expect, beforeEach } from 'vitest';
import { CliSink } from '../../src';
import type { JournalEntry } from '../../src';

function makeEntry(partial: Partial<JournalEntry> = {}): JournalEntry {
  return {
    timestamp: Date.now(),
    level: 'info',
    message: 'Hello',
    artifacts: [],
    meta: {},
    ...partial,
  };
}

describe('CliSink', () => {
  describe('applies color based on level', () => {
    let out: string;
    let stream: any;
    let sink: CliSink;

    beforeEach(() => {
      out = '';
      stream = { write: (s: string) => { out += s; } } as any;
      sink = new CliSink({ stream, verbosity: 2 });
    });

    it('debug -> bright black (gray)', async () => {
      await sink.publish(makeEntry({ level: 'debug' }));
      expect(out).toContain('\u001b[90m');
    });

    it('warn -> yellow', async () => {
      await sink.publish(makeEntry({ level: 'warn' }));
      expect(out).toContain('\u001b[33m');
    });

    it('error -> red', async () => {
      await sink.publish(makeEntry({ level: 'error' }));
      expect(out).toContain('\u001b[31m');
    });

    it('info -> no specific color', async () => {
      await sink.publish(makeEntry({ level: 'info' }));
      expect(out).not.toContain('\u001b[90m');
      expect(out).not.toContain('\u001b[33m');
      expect(out).not.toContain('\u001b[31m');
    });
  });

  it('does not print artifacts/meta when verbosity < 3', async () => {
    let out = '';
    const stream = { write: (s: string) => { out += s; } } as any;
    const sink = new CliSink({ stream, verbosity: 2 });

    await sink.publish(makeEntry({
      message: 'Hello',
      artifacts: ['a.txt', 'b.txt'],
      meta: { a: 1, b: 'two' },
    }));

    expect(out).toContain('Hello');
    expect(out).not.toContain('[Artifacts]');
    expect(out).not.toContain('[Meta]');
  });

  it('prints artifacts as list and meta as YAML when verbosity >= 3', async () => {
    let out = '';
    const stream = { write: (s: string) => { out += s; } } as any;
    const sink = new CliSink({ stream, verbosity: 3 });

    await sink.publish(makeEntry({
      message: 'Hello',
      artifacts: ['a.txt', 'b.txt'],
      meta: { a: 1, b: 'two' },
    }));

    expect(out).toContain('[Artifacts]');
    expect(out).toContain('- a.txt');
    expect(out).toContain('- b.txt');
    expect(out).toContain('[Meta]');
    expect(out).toMatch(/a:\s*1/);
    expect(out).toMatch(/b:\s*two/);
  });

  describe('verbosity thresholds', () => {
    it('debug is only outputted if verbosity >= 2', async () => {
      let out = '';
      const stream = { write: (s: string) => { out += s; } } as any;

      await new CliSink({ stream, verbosity: 0 }).publish(makeEntry({ level: 'debug' }));
      expect(out).toBe('');
      await new CliSink({ stream, verbosity: 1 }).publish(makeEntry({ level: 'debug' }));
      expect(out).toBe('');
      await new CliSink({ stream, verbosity: 2 }).publish(makeEntry({ level: 'debug' }));
      expect(out).not.toBe('');
      out = '';
      await new CliSink({ stream, verbosity: 3 }).publish(makeEntry({ level: 'debug' }));
      expect(out).not.toBe('');
    });

    it('info is only outputted if verbosity >= 1', async () => {
      let out = '';
      const stream = { write: (s: string) => { out += s; } } as any;

      await new CliSink({ stream, verbosity: 0 }).publish(makeEntry({ level: 'info' }));
      expect(out).toBe('');
      await new CliSink({ stream, verbosity: 1 }).publish(makeEntry({ level: 'info' }));
      expect(out).not.toBe('');
    });

    it('with verbosity 0, only warn and error are outputted', async () => {
      let out = '';
      const stream = { write: (s: string) => { out += s; } } as any;
      const sink = new CliSink({ stream, verbosity: 0 });

      await sink.publish(makeEntry({ level: 'debug' }));
      await sink.publish(makeEntry({ level: 'info' }));
      expect(out).toBe('');

      await sink.publish(makeEntry({ level: 'warn' }));
      expect(out).not.toBe('');
      out = '';
      await sink.publish(makeEntry({ level: 'error' }));
      expect(out).not.toBe('');
    });
  });
});
