import { createHash } from 'node:crypto';

function hashId(input: string): Buffer {
  return createHash('sha256').update(input, 'utf8').digest();
}

export function toIdBlob(id: string): Buffer {
  const normalized = id.toLowerCase();
  if (/^[0-9a-f]{64}$/.test(normalized)) {
    return Buffer.from(normalized, 'hex');
  }

  return hashId(id);
}

export function fromIdBlob(id: Uint8Array): string {
  return Buffer.from(id).toString('hex');
}

