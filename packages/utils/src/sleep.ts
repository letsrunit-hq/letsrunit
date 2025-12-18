type SleepOptions = {
  signal?: AbortSignal;
}

type RetryOptions = SleepOptions & {
  timeout?: number;   // total time to keep trying
  interval?: number;  // delay between attempts
};

/**
 * Sleep for a specified time.
 * Supports abort signal.
 */
export function sleep(time: number, { signal }: SleepOptions = {}): Promise<void> {
  if (time <= 0) return Promise.resolve();

  if (signal?.aborted) {
    return Promise.reject(signal.reason);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, time);

    const onAbort = () => {
      cleanup();
      reject(signal?.reason);
    };

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true } as AddEventListenerOptions);
    }
  });
}

/**
 * Retry the function if it throws an error, within the given time.
 */
export async function eventually<T>(
  fn: () => T | Promise<T>,
  { timeout = 5000, interval = 200, signal: signal2 }: RetryOptions = {},
): Promise<T> {
  let lastErr: unknown;
  const signal1 = AbortSignal.timeout(timeout);
  const signal = signal2 ? AbortSignal.any([signal1, signal2]) : signal1;

  while (!signal.aborted) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await sleep(interval, { signal });
    }
  }

  throw lastErr;
}
