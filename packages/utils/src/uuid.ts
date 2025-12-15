import { UUID } from 'node:crypto';
import { NIL, v5 as uuidv5, validate } from 'uuid';

export function isUUID(value: string): value is UUID {
  return validate(value);
}

export function fixedUUID(index: string | number, group = ''): UUID {
  const ns = uuidv5(group, NIL);
  return uuidv5(String(index), ns) as UUID;
}

export function uuidToTag(id: string, length = 10): string {
  const hex = id.replace(/-/g, '');
  const n = BigInt('0x' + hex);
  const s = n.toString(36);
  return s.slice(-length);
}
