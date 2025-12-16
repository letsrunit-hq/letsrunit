export type SleepOptions = {
  signal?: AbortSignal;
}

export type RetryOptions = SleepOptions & {
  timeout?: number;   // total time to keep trying
  interval?: number;  // delay between attempts
};

export function sleep(time: number, { signal }: SleepOptions = {}): Promise<void> {
  if (time <= 0) return Promise.resolve();

  if (signal?.aborted) {
    return Promise.reject(
      // prefer provided reason when available
      (signal as AbortSignal & { reason?: unknown }).reason ?? new Error('Aborted'),
    );
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, time);

    const onAbort = () => {
      cleanup();
      // use AbortSignal.reason if present (Node 18+/WHATWG), else generic Error
      const reason = (signal as AbortSignal & { reason?: unknown })?.reason;
      reject(reason ?? new Error('Aborted'));
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

export async function eventually(
  fn: () => void | Promise<void>,
  { timeout = 5000, interval = 200, signal }: RetryOptions = {},
): Promise<void> {
  const deadline = Date.now() + timeout;
  let lastErr: unknown;

  while (Date.now() < deadline) {
    try {
      await fn();
      return; // ✅ success
    } catch (e) {
      lastErr = e;
      await sleep(interval, { signal });
    }
  }

  throw lastErr;
}
