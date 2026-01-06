export function isBinary(input: unknown): input is Uint8Array {
  return input instanceof Uint8Array;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  // Preserve well-known special objects
  if (value instanceof Date) return false;
  if (value instanceof RegExp) return false;
  if (value instanceof Uint8Array) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

export function isEntity<T extends {id: any}>(value: null | undefined | {} | T): value is T {
  return typeof value === 'object' && value !== null && 'id' in value;
}
