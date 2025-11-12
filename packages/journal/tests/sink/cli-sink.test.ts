import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CliSink } from '../../src';
import type { JournalEntry } from '../../src';

function makeEntry(partial: Partial<JournalEntry> = {}): JournalEntry {
  return {
    timestamp: Date.now(),
    type: 'info',
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
      await sink.publish(makeEntry({ type: 'debug' }));
      expect(out).toContain('\u001b[90m');
    });

    it('warn -> yellow', async () => {
      await sink.publish(makeEntry({ type: 'warn' }));
      expect(out).toContain('\u001b[33m');
    });

    it('error -> red', async () => {
      await sink.publish(makeEntry({ type: 'error' }));
      expect(out).toContain('\u001b[31m');
    });

    it('info -> no specific color', async () => {
      await sink.publish(makeEntry({ type: 'info' }));
      expect(out).not.toContain('\u001b[90m');
      expect(out).not.toContain('\u001b[33m');
      expect(out).not.toContain('\u001b[31m');
    });
  });

  it('does not print meta when verbosity < 3', async () => {
    let out = '';
    const stream = { write: (s: string) => { out += s; } } as any;
    const sink = new CliSink({ stream, verbosity: 2 });

    await sink.publish(makeEntry({
      message: 'Hello',
      meta: { a: 1, b: 'two' },
    }));

    expect(out).toContain('Hello');
    expect(out).not.toContain('[Meta]');
  });

  it('prints meta as YAML when verbosity >= 3', async () => {
    let out = '';
    const stream = { write: (s: string) => { out += s; } } as any;
    const sink = new CliSink({ stream, verbosity: 3 });

    await sink.publish(makeEntry({
      message: 'Hello',
      meta: { a: 1, b: 'two' },
    }));

    expect(out).toContain('[Meta]');
    expect(out).toMatch(/a:\s*1/);
    expect(out).toMatch(/b:\s*two/);
  });

  describe('verbosity thresholds', () => {
    it('debug is only outputted if verbosity >= 2', async () => {
      let out = '';
      const stream = { write: (s: string) => { out += s; } } as any;

      await new CliSink({ stream, verbosity: 0 }).publish(makeEntry({ type: 'debug' }));
      expect(out).toBe('');
      await new CliSink({ stream, verbosity: 1 }).publish(makeEntry({ type: 'debug' }));
      expect(out).toBe('');
      await new CliSink({ stream, verbosity: 2 }).publish(makeEntry({ type: 'debug' }));
      expect(out).not.toBe('');
      out = '';
      await new CliSink({ stream, verbosity: 3 }).publish(makeEntry({ type: 'debug' }));
      expect(out).not.toBe('');
    });

    it('info is only outputted if verbosity >= 1', async () => {
      let out = '';
      const stream = { write: (s: string) => { out += s; } } as any;

      await new CliSink({ stream, verbosity: 0 }).publish(makeEntry({ type: 'info' }));
      expect(out).toBe('');
      await new CliSink({ stream, verbosity: 1 }).publish(makeEntry({ type: 'info' }));
      expect(out).not.toBe('');
    });

    it('with verbosity 0, only error is outputted', async () => {
      let out = '';
      const stream = { write: (s: string) => { out += s; } } as any;
      const sink = new CliSink({ stream, verbosity: 0 });

      await sink.publish(makeEntry({ type: 'debug' }));
      await sink.publish(makeEntry({ type: 'info' }));
      await sink.publish(makeEntry({ type: 'warn' }));
      expect(out).toBe('');

      await sink.publish(makeEntry({ type: 'error' }));
      expect(out).not.toBe('');
    });
  });

  describe('artifact storage', () => {
    it('writes artifacts to disk when artifactPath is provided', async () => {
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      const sink = new CliSink({ artifactPath: '/tmp/run-1', writeFile: writeFileMock, verbosity: 1, stream: { write() {} } as any });

      const bytes1 = new Uint8Array([1, 2, 3]);
      const bytes2 = new Uint8Array([9, 8]);
      const artifact1: any = { name: 'a.txt', bytes: vi.fn().mockResolvedValue(bytes1) };
      const artifact2: any = { name: 'b.bin', bytes: vi.fn().mockResolvedValue(bytes2) };

      await sink.publish(makeEntry({ message: 'With artifacts', artifacts: [artifact1, artifact2] }));

      expect(artifact1.bytes).toHaveBeenCalledTimes(1);
      expect(artifact2.bytes).toHaveBeenCalledTimes(1);
      expect(writeFileMock).toHaveBeenCalledTimes(2);
      expect(writeFileMock).toHaveBeenCalledWith('/tmp/run-1/a.txt', bytes1);
      expect(writeFileMock).toHaveBeenCalledWith('/tmp/run-1/b.bin', bytes2);
    });

    it('does nothing when artifactPath is not provided', async () => {
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      const sink = new CliSink({ writeFile: writeFileMock, verbosity: 1, stream: { write() {} } as any });

      const bytes = new Uint8Array([7]);
      const artifact: any = { name: 'x.txt', bytes: vi.fn().mockResolvedValue(bytes) };

      await sink.publish(makeEntry({ artifacts: [artifact] }));

      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it('skips when there are no artifacts', async () => {
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      const sink = new CliSink({ artifactPath: '/tmp/run-2', writeFile: writeFileMock, verbosity: 1, stream: { write() {} } as any });

      await sink.publish(makeEntry({ artifacts: [] }));

      expect(writeFileMock).not.toHaveBeenCalled();
    });
  });
});
