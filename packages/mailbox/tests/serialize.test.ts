import { describe, expect, it } from 'vitest';
import { fromEml, toEml } from '../src/serialize';
import type { Email } from '../src/types';

const BASE_EMAIL: Email = {
  timestamp: Date.UTC(2024, 0, 2, 3, 4, 5),
  from: 'Alice <alice@example.com>',
  to: 'Bob <bob@example.com>',
  subject: 'Hello World',
};

describe('serialize EML', () => {
  it('roundtrips text-only', () => {
    const email: Email = { ...BASE_EMAIL, text: 'Plain text body' };
    const eml = toEml(email);
    const parsed = fromEml(eml);
    expect(parsed.from).toBe(email.from);
    expect(parsed.to).toBe(email.to);
    expect(parsed.subject).toBe(email.subject);
    expect(new Date(parsed.timestamp).toUTCString()).toBe(new Date(email.timestamp).toUTCString());
    expect(parsed.text).toBe(email.text);
    expect(parsed.html).toBeUndefined();
  });

  it('roundtrips html-only', () => {
    const email: Email = { ...BASE_EMAIL, html: '<p>Hello <b>world</b></p>' };
    const eml = toEml(email);
    const parsed = fromEml(eml);
    expect(parsed.html).toBe(email.html);
    expect(parsed.text).toBeUndefined();
  });

  it('roundtrips text + html via multipart/alternative', () => {
    const email: Email = { ...BASE_EMAIL, text: 'Hello', html: '<p>Hello</p>' };
    const eml = toEml(email);
    const parsed = fromEml(eml);
    expect(parsed.text).toBe(email.text);
    expect(parsed.html).toBe(email.html);
  });

  it('emits and parses cc if provided', () => {
    const email: Email = { ...BASE_EMAIL, text: 'Body', cc: 'Carol <carol@example.com>' };
    const eml = toEml(email);
    const parsed = fromEml(eml);
    expect(parsed.cc).toBe(email.cc);
  });

  it('supports attachments metadata under multipart/mixed', () => {
    const email: Email = {
      ...BASE_EMAIL,
      text: 'Body',
      attachments: [
        { filename: 'note.txt', contentType: 'text/plain' },
        { filename: 'image.png', contentType: 'image/png' },
      ],
    };
    const eml = toEml(email);
    const parsed = fromEml(eml);
    expect(parsed.attachments?.length).toBe(2);
    expect(parsed.attachments?.[0]).toEqual({ filename: 'note.txt', contentType: 'text/plain' });
    expect(parsed.attachments?.[1]).toEqual({ filename: 'image.png', contentType: 'image/png' });
  });

  it('parses a basic external EML sample (text/plain)', () => {
    const sample = [
      'Date: Tue, 02 Jan 2024 03:04:05 GMT',
      'From: Alice <alice@example.com>',
      'To: Bob <bob@example.com>',
      'Subject: Greetings',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'This is a plain message.',
    ].join('\r\n');
    const parsed = fromEml(sample);
    expect(parsed.subject).toBe('Greetings');
    expect(parsed.text).toBe('This is a plain message.');
    expect(parsed.html).toBeUndefined();
  });
});
