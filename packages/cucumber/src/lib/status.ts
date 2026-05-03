import { TestStepResultStatus } from '@cucumber/messages';

export function normalizeStatus(status: string | number | undefined): string {
  if (typeof status === 'string') return status.toLowerCase();
  if (typeof status === 'number') {
    const names = TestStepResultStatus as Record<number, string>;
    const name = names[status];
    if (typeof name === 'string') return name.toLowerCase();
  }
  return 'unknown';
}

export function toDurationMs(duration?: { seconds?: number; nanos?: number }): number | undefined {
  if (!duration) return undefined;
  const seconds = duration.seconds ?? 0;
  const nanos = duration.nanos ?? 0;
  return seconds * 1000 + Math.floor(nanos / 1_000_000);
}
