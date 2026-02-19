import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemorySink } from '../../src';
import type { JournalEntry } from '../../src';

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

const { mkdir, writeFile } = await import('node:fs/promises');

function makeEntry(partial: Partial<JournalEntry> = {}): JournalEntry {
  return {
    timestamp: 1000,
    type: 'info',
    message: 'Hello',
    artifacts: [],
    meta: {},
    ...partial,
  };
}

function makeArtifact(name: string, data = new Uint8Array([1, 2, 3])): File {
  return { name, bytes: vi.fn().mockResolvedValue(data) } as unknown as File;
}

describe('MemorySink', () => {
  let sink: MemorySink;

  beforeEach(() => {
    vi.clearAllMocks();
    sink = new MemorySink('/artifacts/session-1');
  });

  describe('initial state', () => {
    it('getEntries() returns empty array', () => {
      expect(sink.getEntries()).toEqual([]);
    });

    it('getArtifactPaths() returns empty array', () => {
      expect(sink.getArtifactPaths()).toEqual([]);
    });
  });

  describe('publish()', () => {
    it('stores entry fields in memory', async () => {
      await sink.publish(makeEntry({ timestamp: 2000, type: 'warn', message: 'Watch out' }));

      expect(sink.getEntries()).toEqual([
        { timestamp: 2000, type: 'warn', message: 'Watch out', artifacts: [] },
      ]);
    });

    it('creates the artifact directory', async () => {
      await sink.publish(makeEntry());

      expect(mkdir).toHaveBeenCalledWith('/artifacts/session-1', { recursive: true });
    });

    it('stores multiple entries across multiple publish calls', async () => {
      await sink.publish(makeEntry({ message: 'First' }));
      await sink.publish(makeEntry({ message: 'Second' }));

      expect(sink.getEntries()).toHaveLength(2);
      expect(sink.getEntries()[0].message).toBe('First');
      expect(sink.getEntries()[1].message).toBe('Second');
    });

    it('stores multiple entries in a single publish call', async () => {
      await sink.publish(makeEntry({ message: 'A' }), makeEntry({ message: 'B' }));

      expect(sink.getEntries()).toHaveLength(2);
    });

    it('writes artifact to disk and stores its path', async () => {
      const bytes = new Uint8Array([9, 8, 7]);
      const artifact = makeArtifact('screenshot.png', bytes);

      await sink.publish(makeEntry({ artifacts: [artifact] }));

      expect(writeFile).toHaveBeenCalledWith('/artifacts/session-1/screenshot.png', bytes);
      expect(sink.getEntries()[0].artifacts).toEqual(['/artifacts/session-1/screenshot.png']);
    });

    it('writes multiple artifacts and stores all paths', async () => {
      const a = makeArtifact('a.png');
      const b = makeArtifact('b.png');

      await sink.publish(makeEntry({ artifacts: [a, b] }));

      expect(writeFile).toHaveBeenCalledTimes(2);
      expect(sink.getEntries()[0].artifacts).toEqual([
        '/artifacts/session-1/a.png',
        '/artifacts/session-1/b.png',
      ]);
    });

    it('stores empty artifacts array when entry has no artifacts', async () => {
      await sink.publish(makeEntry({ artifacts: [] }));

      expect(writeFile).not.toHaveBeenCalled();
      expect(sink.getEntries()[0].artifacts).toEqual([]);
    });
  });

  describe('getArtifactPaths()', () => {
    it('returns all artifact paths across all entries', async () => {
      await sink.publish(makeEntry({ artifacts: [makeArtifact('a.png')] }));
      await sink.publish(makeEntry({ artifacts: [makeArtifact('b.png'), makeArtifact('c.png')] }));

      expect(sink.getArtifactPaths()).toEqual([
        '/artifacts/session-1/a.png',
        '/artifacts/session-1/b.png',
        '/artifacts/session-1/c.png',
      ]);
    });
  });

  describe('clear()', () => {
    it('removes all entries', async () => {
      await sink.publish(makeEntry(), makeEntry());
      sink.clear();

      expect(sink.getEntries()).toEqual([]);
    });

    it('resets getArtifactPaths() to empty', async () => {
      await sink.publish(makeEntry({ artifacts: [makeArtifact('a.png')] }));
      sink.clear();

      expect(sink.getArtifactPaths()).toEqual([]);
    });
  });
});
