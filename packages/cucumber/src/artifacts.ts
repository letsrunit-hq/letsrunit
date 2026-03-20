import { AttachmentContentEncoding, type Envelope } from '@cucumber/messages';
import { existsSync } from 'node:fs';
import { mkdir, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_DIR = '.letsrunit/artifacts';

function mimeToExt(mediaType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'text/html': 'html',
    'text/plain': 'txt',
    'application/json': 'json',
    'application/pdf': 'pdf',
  };
  return map[mediaType] ?? 'bin';
}

async function hashBytes(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  type: 'formatter' as const,
  formatter({ on, directory }: { on: (key: 'message', handler: (value: Envelope) => void) => void; directory?: string }) {
    const artifactDir = directory ?? DEFAULT_DIR;
    mkdir(artifactDir, { recursive: true }).catch(() => {});

    on('message', (envelope: Envelope) => {
      const { attachment } = envelope;
      if (!attachment) return;

      const bytes =
        attachment.contentEncoding === AttachmentContentEncoding.BASE64
          ? Buffer.from(attachment.body, 'base64')
          : Buffer.from(attachment.body, 'utf-8');

      const ext = mimeToExt(attachment.mediaType);

      hashBytes(new Uint8Array(bytes)).then(async (hash) => {
        const filepath = join(artifactDir, `${hash}.${ext}`);
        if (existsSync(filepath)) {
          const now = new Date();
          await utimes(filepath, now, now);
        } else {
          await writeFile(filepath, bytes);
        }
      }).catch(() => {});
    });
  },
};
