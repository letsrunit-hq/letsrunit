import { describe, expect, it } from 'vitest';
import { err, text } from '../../src/utility/response';

describe('text', () => {
  it('returns a content block with type "text"', () => {
    expect(text('hello')).toEqual({
      content: [{ type: 'text', text: 'hello' }],
    });
  });

  it('does not set isError', () => {
    expect((text('ok') as any).isError).toBeUndefined();
  });
});

describe('err', () => {
  it('sets isError to true', () => {
    expect(err('oops').isError).toBe(true);
  });

  it('includes the message in content', () => {
    expect(err('something went wrong').content[0].text).toBe('something went wrong');
  });

  it('content type is "text"', () => {
    expect(err('x').content[0].type).toBe('text');
  });
});
