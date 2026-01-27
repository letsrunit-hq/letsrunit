import type { UUID } from '@letsrunit/utils';
import type { SnakeCaseKeys } from 'snakecase-keys';
import { z } from 'zod';

export type SerializeDates<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? SerializeDates<U>[]
    : T extends Record<string, any>
      ? { [K in keyof T]: SerializeDates<T[K]> }
      : T;

// Snake_case keys + Date fields als ISO string
export type Data<T> = SnakeCaseKeys<SerializeDates<T>>;

export const UUIDSchema: z.ZodType<UUID> = z.uuid() as z.ZodType<UUID>;
