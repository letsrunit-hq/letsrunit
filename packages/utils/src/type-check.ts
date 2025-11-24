export function isBinary(input: unknown): input is Uint8Array {
  return input instanceof Uint8Array;
}
