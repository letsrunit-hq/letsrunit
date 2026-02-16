# Utils Package (`@letsrunit/utils`)

## Installation

```bash
npm install @letsrunit/utils
# or
yarn add @letsrunit/utils
```

Shared TypeScript utility functions used across the monorepo.

## Exported Functions

### Async & Sleep

- **`sleep(time, opts)`**: A promise-based sleep function that supports `AbortSignal`.
- **`eventually(fn, opts)`**: Retries an asynchronous function until it succeeds or a timeout is reached.

### URL & Path

- **`splitUrl(url)`**: Splits a URL into its base (`protocol + host`) and path components.
- **`asFilename(name, ext?)`**: Converts a string into a URL-friendly filename.
- **`pathRegexp(path)`**: Converts a path pattern (e.g., `/books/:id`) into a regular expression and extracts parameter names.

### UUID & Hashing

- **`isUUID(value)`**: Checks if a string is a valid UUID.
- **`fixedUUID(index, group?)`**: Generates a deterministic UUID based on an index and optional group.
- **`uuidToTag(id, length?)`**: Converts a UUID into a short, URL-friendly tag.
- **`hash(input)`**: Generates a SHA-256 hash of the input (supports strings, objects, and binary data).

### Object & Array

- **`clean(array)`**: Removes null or undefined values from an array.
- **`pick(obj, keys)`**: Creates a new object by picking specific keys from the source object.
- **`omit(obj, keys)`**: Creates a new object by omitting specific keys from the source object.
- **`cartesian(...arrays)`**: Calculates the Cartesian product of multiple arrays.

### Type Checking

- **`isBinary(value)`**: Checks if a value is a `Buffer`, `Uint8Array`, or `ArrayBuffer`.
- **`isString(value)`**: Checks if a value is a string.

## Testing

Run tests for this package:

```bash
yarn test
```
