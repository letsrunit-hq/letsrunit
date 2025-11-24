import { createHash } from 'node:crypto';

export function hash(input: Uint8Array | string): string {
  return createHash('sha256').update(input).digest('hex');
}
