import type { Readable } from 'node:stream';

type AttachData = string | Buffer | Readable;
type AttachOptions = string | {
  mediaType: string;
  fileName?: string;
};

export function toFile(data: AttachData, options?: AttachOptions): File {
  const opt =
    typeof options === 'string'
      ? { mediaType: options }
      : options ?? { mediaType: 'application/octet-stream' };

  const type = opt.mediaType || 'application/octet-stream';
  const name = opt.fileName || `attachment-${Date.now()}`;

  if (isReadable(data)) {
    throw new Error('toFile does not support Readable streams; provide Buffer or string');
  }

  const part = typeof data === 'string' ? data : new Uint8Array(data);

  return new File([part], name, { type });
}

function isReadable(value: unknown): value is Readable {
  return (
    !!value &&
    typeof value === 'object' &&
    (typeof (value as any).pipe === 'function' || typeof (value as any).read === 'function')
  );
}
