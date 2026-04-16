import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type JournalEntry, SupabaseSink } from '../../src';

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
  const runId = 'run-789';
  const testId = 'test-123';
  const processId = 'process-456';
  const projectId = 'project-123';
  let consoleMock: { error: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };
  let insertMock: ReturnType<typeof vi.fn>;
  let uploadMock: ReturnType<typeof vi.fn>;
  let getPublicUrlMock: ReturnType<typeof vi.fn>;
  let fromTableMock: ReturnType<typeof vi.fn>;
  let storageFromMock: ReturnType<typeof vi.fn>;
  let client: any;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    consoleMock = { error: vi.fn(), warn: vi.fn() };

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

  it('inserts a log row linked to a run and test', async () => {
    const sink = new SupabaseSink({
      supabase: client,
      source: { projectId, runId },
      console: consoleMock as any,
    });

    await sink.publish(makeEntry({ message: 'Linked to run', meta: { testId } }));

    expect(fromTableMock).toHaveBeenCalledWith('log_entries');
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toBeCalledWith(
      expect.objectContaining({
        project_id: projectId,
        run_id: runId,
        test_id: testId,
        process_id: undefined,
        message: 'Linked to run',
        meta: {},
      }),
    );
  });

  it('inserts a log row linked to a process', async () => {
    const sink = new SupabaseSink({
      supabase: client,
      source: { projectId, processId },
      console: consoleMock as any,
    });

    await sink.publish(makeEntry({ message: 'Linked to process', meta: { testId } }));

    expect(insertMock).toBeCalledWith(
      expect.objectContaining({
        project_id: projectId,
        run_id: undefined,
        test_id: undefined,
        process_id: processId,
        message: 'Linked to process',
        meta: {}, // testId is stripped from meta
      }),
    );
  });

  it('uploads artifacts to storage if not exists', async () => {
    const sink = new SupabaseSink({
      supabase: client,
      source: { projectId, runId },
      bucket: 'artifacts',
      console: consoleMock as any,
    });

    const bytes = new Uint8Array([1, 2, 3]);
    const artifact: any = {
      name: 'a.txt',
      size: bytes.length,
      bytes: vi.fn().mockResolvedValue(bytes),
      type: 'text/plain',
    };

    await sink.publish(makeEntry({ message: 'With file', artifacts: [artifact] }));

    // HEAD request to check existence
    expect(fetch).toHaveBeenCalledWith(`https://cdn.example/${projectId}/a.txt`, { method: 'HEAD' });

    // Upload called with correct bucket and path
    expect(storageFromMock).toHaveBeenCalledWith('artifacts');
    expect(uploadMock).toHaveBeenCalledWith(`${projectId}/a.txt`, bytes, { upsert: true, contentType: 'text/plain' });

    // Insert contains artifacts with public URL
    expect(insertMock).toBeCalledWith(
      expect.objectContaining({
        artifacts: [{ name: 'a.txt', url: `https://cdn.example/${projectId}/a.txt`, size: bytes.length }],
      }),
    );
  });

  it('skips upload if artifact already exists', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    const sink = new SupabaseSink({
      supabase: client,
      source: { projectId, runId },
      bucket: 'artifacts',
      console: consoleMock as any,
    });

    const bytes = new Uint8Array([1, 2, 3]);
    const artifact: any = {
      name: 'exists.txt',
      size: bytes.length,
      bytes: vi.fn().mockResolvedValue(bytes),
      type: 'text/plain',
    };

    await sink.publish(makeEntry({ message: 'Exists', artifacts: [artifact] }));

    expect(fetch).toHaveBeenCalledWith(`https://cdn.example/${projectId}/exists.txt`, { method: 'HEAD' });
    expect(uploadMock).not.toHaveBeenCalled();

    // Still inserts row with artifact info
    expect(insertMock).toBeCalledWith(
      expect.objectContaining({
        artifacts: [{ name: 'exists.txt', url: `https://cdn.example/${projectId}/exists.txt`, size: bytes.length }],
      }),
    );
  });

  it('skips artifact on upload error and still inserts row', async () => {
    uploadMock.mockResolvedValueOnce({ error: { message: 'fail' } });

    const sink = new SupabaseSink({
      supabase: client,
      source: { projectId, runId },
      bucket: 'artifacts',
      console: consoleMock as any,
    });

    const bytes = new Uint8Array([9, 9]);
    const artifact: any = { name: 'bad.bin', size: bytes.length, bytes: vi.fn().mockResolvedValue(bytes) };

    await sink.publish(makeEntry({ message: 'Upload fails', artifacts: [artifact] }));

    expect(uploadMock).toHaveBeenCalled();

    // Insert should have empty artifacts
    expect(insertMock).toBeCalledWith(expect.objectContaining({ artifacts: [] }));
  });

  it('logs insert errors', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'insert failed' } });
    const sink = new SupabaseSink({
      supabase: client,
      source: { projectId, runId },
      console: consoleMock as any,
    });

    await sink.publish(makeEntry({ message: 'bad insert' }));

    expect(consoleMock.error).toHaveBeenCalledWith('SupabaseSink insert failed:', { message: 'insert failed' });
  });

  it('warns when ensureBucket create fails', async () => {
    client.storage.createBucket = vi.fn().mockRejectedValue(new Error('bucket fail'));
    const sink = new SupabaseSink({
      supabase: client,
      source: { projectId, runId },
      bucket: 'artifacts',
      console: consoleMock as any,
    });

    const artifact: any = {
      name: 'a.txt',
      size: 1,
      bytes: vi.fn().mockResolvedValue(new Uint8Array([1])),
      type: 'text/plain',
    };
    await sink.publish(makeEntry({ artifacts: [artifact] }));

    expect(consoleMock.warn).toHaveBeenCalled();
  });

  it('treats HEAD fetch failures as not-existing artifact and still uploads', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network fail'));
    const sink = new SupabaseSink({
      supabase: client,
      source: { projectId, runId },
      bucket: 'artifacts',
      console: consoleMock as any,
    });

    const artifact: any = {
      name: 'retry.txt',
      size: 3,
      bytes: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      type: 'text/plain',
    };

    await sink.publish(makeEntry({ artifacts: [artifact] }));
    expect(uploadMock).toHaveBeenCalled();
  });
});
