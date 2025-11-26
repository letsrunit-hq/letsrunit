import { UUID } from 'node:crypto';
import { NIL, v5 as uuidv5, validate } from 'uuid';

export function isUUID(value: string): value is UUID {
  return validate(value);
}

export function fixedUUID(index: number, group = ''): UUID {
  const ns = uuidv5(group, NIL);
  return uuidv5(String(index), ns) as UUID;
}
