import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { toFile } from '../../src/utils/file';

describe('toFile', () => {
  it('creates a file from string data with media type shorthand', async () => {
    const file = toFile('hello', 'text/plain');

    expect(file.type).toBe('text/plain');
    expect(file.name.startsWith('attachment-')).toBe(true);
    expect(await file.text()).toBe('hello');
  });

  it('creates a file from Buffer data with explicit options', async () => {
    const file = toFile(Buffer.from([1, 2, 3]), {
      mediaType: 'application/octet-stream',
      fileName: 'data.bin',
    });

    expect(file.type).toBe('application/octet-stream');
    expect(file.name).toBe('data.bin');
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('uses default media type when options are omitted', () => {
    const file = toFile('x');
    expect(file.type).toBe('application/octet-stream');
  });

  it('throws when data is a readable stream', () => {
    const stream = Readable.from(['chunk']);
    expect(() => toFile(stream)).toThrow('toFile does not support Readable streams');
  });
});
