export type RetryOptions = {
  timeout?: number;   // total time to keep trying
  interval?: number;  // delay between attempts
};

export function sleep(time: number): Promise<void> {
  if (time <= 0) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, time));
}

export async function eventually(
  fn: () => void | Promise<void>,
  { timeout = 5000, interval = 200 }: RetryOptions = {},
): Promise<void> {
  const deadline = Date.now() + timeout;
  let lastErr: unknown;

  while (Date.now() < deadline) {
    try {
      await fn();
      return; // ✅ success
    } catch (e) {
      lastErr = e;
      await sleep(interval);
    }
  }

  throw lastErr;
}
