import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JournalEntry } from '../../src';
import { SupabaseSink } from '../../src/sink/supabase-sink';

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

describe('SupabaseSink', () => {
  const runId = 'run-123';
  let insertMock: ReturnType<typeof vi.fn>;
  let uploadMock: ReturnType<typeof vi.fn>;
  let getPublicUrlMock: ReturnType<typeof vi.fn>;
  let fromTableMock: ReturnType<typeof vi.fn>;
  let storageFromMock: ReturnType<typeof vi.fn>;
  let client: any;

  beforeEach(() => {
    insertMock = vi.fn().mockResolvedValue({ error: null });
    fromTableMock = vi.fn((_table: string) => ({ insert: insertMock }));

    uploadMock = vi.fn().mockResolvedValue({ error: null });
    getPublicUrlMock = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }));
    const storageBucketApi = { upload: uploadMock, getPublicUrl: getPublicUrlMock };
    storageFromMock = vi.fn((_bucket: string) => storageBucketApi);

    client = {
      from: fromTableMock,
      storage: { from: storageFromMock },
    } as any;
  });

  it('inserts a log row', async () => {
    const sink = new SupabaseSink({ supabase: client, runId });

    await sink.publish(makeEntry({ message: 'No files', artifacts: [] }));

    expect(fromTableMock).toHaveBeenCalledWith('log_entries');
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toBeCalledWith(
      expect.objectContaining({
        run_id: runId,
        type: 'info',
        message: 'No files',
        meta: {},
        artifacts: [],
        created_at: expect.any(String),
      }),
    );

    // No storage interactions
    expect(storageFromMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(getPublicUrlMock).not.toHaveBeenCalled();
  });

  it('uploads artifacts to storage', async () => {
    const sink = new SupabaseSink({ supabase: client, runId, bucket: 'logs' });

    const bytes = new Uint8Array([1, 2, 3]);
    const artifact: any = { name: 'a.txt', size: bytes.length, bytes: vi.fn().mockResolvedValue(bytes) };

    await sink.publish(makeEntry({ message: 'With file', artifacts: [artifact] }));

    // Upload called with correct bucket and path
    expect(storageFromMock).toHaveBeenCalledWith('logs');
    expect(uploadMock).toHaveBeenCalledWith(`${runId}/a.txt`, bytes, { upsert: false });

    // Insert contains artifacts with public URL
    expect(insertMock).toBeCalledWith(
      expect.objectContaining({
        artifacts: [{ name: 'a.txt', url: `https://cdn.example/${runId}/a.txt`, size: bytes.length }],
      }),
    );
  });

  it('skips artifact on upload error and still inserts row', async () => {
    uploadMock.mockResolvedValueOnce({ error: { message: 'fail' } });

    const sink = new SupabaseSink({ supabase: client, runId, bucket: 'logs' });

    const bytes = new Uint8Array([9, 9]);
    const artifact: any = { name: 'bad.bin', size: bytes.length, bytes: vi.fn().mockResolvedValue(bytes) };

    await sink.publish(makeEntry({ message: 'Upload fails', artifacts: [artifact] }));

    expect(uploadMock).toHaveBeenCalled();
    expect(getPublicUrlMock).not.toHaveBeenCalled();

    // Insert should have empty artifacts
    expect(insertMock).toBeCalledWith(expect.objectContaining({ artifacts: [] }));
  });
});
