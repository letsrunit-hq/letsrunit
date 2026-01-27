import stringify from 'fast-json-stable-stringify';
import { isBinary } from './type-check';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

export async function hash(input: unknown): Promise<string> {
  const payload = isBinary(input) || typeof input === 'string' ? input : stringify(input);

  const bytes = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload;

  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(bytes));
  return toHex(new Uint8Array(digest));
}

export async function hashKey(template: string, input: unknown): Promise<string> {
  const hashVal = await hash(input);
  return template.replace('{hash}', hashVal);
}
