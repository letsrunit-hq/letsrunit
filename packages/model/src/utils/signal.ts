export function maybeSignal(opts: { signal?: AbortSignal }): AbortSignal {
  return opts.signal ?? new AbortController().signal;
}
