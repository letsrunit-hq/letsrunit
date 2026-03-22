import { describe, expect, it } from 'vitest';
import { isPage } from '../../src/utils/type-check';

describe('isPage', () => {
  it('returns true when object has content, url, and screenshot functions', () => {
    const page = {
      content: () => Promise.resolve('<html/>'),
      url: () => 'https://example.com',
      screenshot: () => Promise.resolve(Buffer.from([])),
    };
    expect(isPage(page)).toBe(true);
  });

  it('returns false when content is missing', () => {
    const page = {
      url: () => '',
      screenshot: () => Promise.resolve(Buffer.from([])),
    };
    expect(isPage(page)).toBe(false);
  });

  it('returns false when url is missing', () => {
    const page = {
      content: () => Promise.resolve('<html/>'),
      screenshot: () => Promise.resolve(Buffer.from([])),
    };
    expect(isPage(page)).toBe(false);
  });

  it('returns false when screenshot is missing', () => {
    const page = {
      content: () => Promise.resolve('<html/>'),
      url: () => '',
    };
    expect(isPage(page)).toBe(false);
  });

  it('returns false for a plain object', () => {
    expect(isPage({ html: '<html/>', url: 'https://example.com' })).toBe(false);
  });
});
