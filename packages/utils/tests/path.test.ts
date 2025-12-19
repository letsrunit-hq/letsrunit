import { describe, expect, it } from 'vitest';
import { asFilename, pathRegexp, splitUrl } from '../src';

describe('splitUrl', () => {
  it('returns base and path portions including search and hash', () => {
    const result = splitUrl('https://example.com:8080/foo/bar?query=1#frag');

    expect(result.base).toBe('https://example.com:8080');
    expect(result.path).toBe('/foo/bar?query=1#frag');
  });

  it('handles root url without search or hash', () => {
    const result = splitUrl('http://localhost/');

    expect(result).toEqual({ base: 'http://localhost', path: '/' });
  });
});

describe('asFilename', () => {
  it('normalizes text to lowercase hyphenated form', () => {
    expect(asFilename('Hello World')).toBe('hello-world');
    expect(asFilename('  Mixed__Case!!  ')).toBe('mixed-case');
  });

  it('collapses separators and trims leading or trailing dashes', () => {
    expect(asFilename('---Already--spaced---')).toBe('already-spaced');
    expect(asFilename('Multi   separator---example')).toBe('multi-separator-example');
  });

  it('adds the extension', () => {
    expect(asFilename('Hello World', 'txt')).toBe('hello-world.txt');
  })
});

describe('pathRegexp', () => {
  it('captures parameter names and matches dynamic segments', () => {
    const { regexp, names } = pathRegexp('/blog/:slug/comments/:commentId');

    expect(names).toEqual(['slug', 'commentId']);

    const match = '/blog/my-article/comments/42'.match(regexp);
    expect(match?.[1]).toBe('my-article');
    expect(match?.[2]).toBe('42');
  });

  it('escapes static segments and does not match extra paths', () => {
    const { regexp, names } = pathRegexp('/files/v1.0/:name');

    expect(names).toEqual(['name']);
    expect('/files/v1.0/report.pdf'.match(regexp)?.[1]).toBe('report.pdf');
    expect('/files/v1x0/report.pdf'.match(regexp)).toBeNull();
    expect('/files/v1.0/report.pdf/extra'.match(regexp)).toBeNull();
  });
});
