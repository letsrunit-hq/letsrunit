import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveScreenshot } from '../../src/utils/screenshot';

describe('saveScreenshot', () => {
  let uploadMock: any;
  let getPublicUrlMock: any;
  let createBucketMock: any;
  let client: any;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    uploadMock = vi.fn().mockResolvedValue({ error: null });
    getPublicUrlMock = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }));
    createBucketMock = vi.fn().mockResolvedValue({});

    client = {
      storage: {
        createBucket: createBucketMock,
        from: vi.fn((_bucket: string) => ({
          upload: uploadMock,
          getPublicUrl: getPublicUrlMock,
        })),
      },
    } as any;
  });

  it('uploads screenshot if not exists', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const file = {
      name: 'test.png',
      type: 'image/png',
      size: bytes.length,
      bytes: vi.fn().mockResolvedValue(bytes),
    } as any;

    const url = await saveScreenshot('project-1', file, { supabase: client });

    expect(fetch).toHaveBeenCalledWith(`https://cdn.example/project-1/test.png`, { method: 'HEAD' });
    expect(uploadMock).toHaveBeenCalledWith('project-1/test.png', bytes, {
      contentType: 'image/png',
      upsert: true,
    });
    expect(url).toBe('https://cdn.example/project-1/test.png');
  });

  it('skips upload if screenshot already exists', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    const bytes = new Uint8Array([1, 2, 3]);
    const file = {
      name: 'exists.png',
      type: 'image/png',
      size: bytes.length,
      bytes: vi.fn().mockResolvedValue(bytes),
    } as any;

    const url = await saveScreenshot('project-1', file, { supabase: client });

    expect(fetch).toHaveBeenCalledWith(`https://cdn.example/project-1/exists.png`, { method: 'HEAD' });
    expect(uploadMock).not.toHaveBeenCalled();
    expect(url).toBe('https://cdn.example/project-1/exists.png');
  });
});
