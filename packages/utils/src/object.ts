import type { Clean } from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  // Preserve well-known special objects
  if (value instanceof Date) return false;
  if (value instanceof RegExp) return false;
  if (value instanceof Uint8Array) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Shallowly cleans values:
 * - Plain objects: remove top-level properties that are null or undefined (no recursion).
 * - Arrays: filter out elements that are null or undefined (no recursion into items).
 * - Non-plain objects and primitives are returned as-is.
 */
export function clean<T>(input: T): Clean<T> {
  // Primitives and special instances are returned as-is
  if (
    input === null ||
    input === undefined ||
    typeof input !== 'object' ||
    input instanceof Date ||
    input instanceof RegExp ||
    input instanceof Uint8Array
  ) {
    return input as unknown as Clean<T>;
  }

  if (Array.isArray(input)) {
    const filtered = (input as unknown[]).filter((v) => v !== null && v !== undefined);
    return filtered as unknown as Clean<T>;
  }

  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (value === null || value === undefined) continue;
      result[key] = value as unknown;
    }
    return result as unknown as Clean<T>;
  }

  return input as unknown as Clean<T>;
}

/**
 * Picks a subset of properties from an object by key list.
 * Returns a new object containing only the specified keys (if the key exists on the object).
 */
export function pick<T extends object, K extends readonly (keyof T)[]>(
  obj: T,
  keys: K
): Pick<T, K[number]> {
  const out: Partial<Pick<T, K[number]>> = {};
  for (const key of keys) {
    if (key in obj) {
      out[key] = obj[key];
    }
  }
  return out as Pick<T, K[number]>;
}
