import { NIL, v5 as uuidv5 } from 'uuid';
import { describe, expect, it } from 'vitest';
import { fixedUUID, isUUID, uuidToTag } from '../src';

const sampleUUID = '123e4567-e89b-12d3-a456-426614174000';

describe('isUUID', () => {
  it('recognizes valid UUID strings', () => {
    expect(isUUID(sampleUUID)).toBe(true);
  });

  it('rejects non-UUID strings', () => {
    expect(isUUID('not-a-uuid')).toBe(false);
    expect(isUUID('1234')).toBe(false);
  });
});

describe('fixedUUID', () => {
  it('returns a deterministic UUID for the same index and group', () => {
    const index = 7;
    const group = 'alpha-team';

    const first = fixedUUID(index, group);
    const second = fixedUUID(index, group);
    const expected = uuidv5(String(index), uuidv5(group, NIL));

    expect(first).toBe(expected);
    expect(second).toBe(expected);
  });

  it('namespaces UUIDs by group so identical indexes differ across groups', () => {
    const sharedIndex = 3;

    const firstGroup = fixedUUID(sharedIndex, 'group-a');
    const secondGroup = fixedUUID(sharedIndex, 'group-b');

    expect(firstGroup).not.toBe(secondGroup);
    expect(isUUID(firstGroup)).toBe(true);
    expect(isUUID(secondGroup)).toBe(true);
  });
});

describe('uuidToTag', () => {
  it('derives a base36 tag from a UUID and trims to the default length', () => {
    expect(uuidToTag(sampleUUID)).toBe('8qi6qgrlz4');
  });

  it('supports custom tag lengths by trimming the suffix', () => {
    expect(uuidToTag(sampleUUID, 8)).toBe('i6qgrlz4');
  });
});
