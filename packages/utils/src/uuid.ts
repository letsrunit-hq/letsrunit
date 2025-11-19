import { UUID } from 'node:crypto';
import { validate } from 'uuid';

export function isUUID(value: string): value is UUID {
  return validate(value);
}
