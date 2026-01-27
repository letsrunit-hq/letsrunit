import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import { z } from 'zod';
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

export function fromData<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  return (record: Data<z.infer<TSchema>>): z.infer<TSchema> => {
    const camel = camelcaseKeys(record as any, { deep: true });
    return schema.parse(camel);
  };
}

export function toData<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  return (input: z.infer<TSchema>): Data<z.infer<TSchema>> => {
    const parsed = schema.parse(input);
    const dated = serializeDates(parsed);
    const cleaned = pruneUndefined(dated);

    return snakecaseKeys(cleaned as any, { deep: true }) as any;
  };
}

export function toFilter<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  filter: Partial<z.infer<TSchema>>,
): string {
  const partialSchema = (schema as any).partial ? (schema as any).partial() : schema;
  const data = toData(partialSchema)(filter);
  const parts = Object.entries(data).map(([field, val]) => `${field}=eq.${val}`);
  return parts.join(',');
}
