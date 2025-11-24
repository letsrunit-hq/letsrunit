import { z } from 'zod';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import type { Data, SerializeDates } from '../types';

function pruneUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => pruneUndefined(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      result[k] = pruneUndefined(v as any);
    }
    return result as T;
  }
  return value;
}

function serializeDates<T>(value: T): SerializeDates<T> {
  if (value instanceof Date) {
    return value.toISOString() as SerializeDates<T>;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeDates(item)) as SerializeDates<T>;
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = serializeDates(val);
    }
    return result as SerializeDates<T>;
  }

  return value as SerializeDates<T>;
}

export function fromData<TSchema extends z.ZodObject>(schema: TSchema) {
  return (record: Data<z.infer<TSchema>>): z.infer<TSchema> => {
    const camel = camelcaseKeys(record, { deep: true });
    return schema.parse(camel);
  };
}

export function toData<TSchema extends z.ZodObject>(schema: TSchema) {
  return (input: z.infer<TSchema>): Data<z.infer<TSchema>> => {
    const parsed = schema.parse(input);
    const dated = serializeDates(parsed);
    const cleaned = pruneUndefined(dated);

    return snakecaseKeys(cleaned, { deep: true });
  };
}
