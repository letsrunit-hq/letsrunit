import stringify from 'fast-json-stable-stringify';
import { createHash } from 'node:crypto';
import { isBinary } from './type-check';

export function hash(input: any): string {
  const payload = isBinary(input) || typeof input === 'string' ? input : stringify(input);
  return createHash('sha256').update(payload).digest('hex');
}
