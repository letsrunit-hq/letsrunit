export function sleep(time: number): Promise<void> {
  if (time <= 0) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, time));
}
