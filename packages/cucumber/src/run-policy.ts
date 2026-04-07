type WorldParameters = {
  headless?: unknown;
  skipCloseOnFailure?: unknown;
};

const FAILURE_STATUSES = new Set(['FAILED', 'AMBIGUOUS', 'UNDEFINED']);

function toBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  }
  return defaultValue;
}

export function resolveHeadless(parameters: WorldParameters | undefined): boolean {
  return toBoolean(parameters?.headless, true);
}

export function shouldKeepBrowserOpenOnFailure(
  parameters: WorldParameters | undefined,
  scenarioStatus: string | undefined,
): boolean {
  const failed = !!scenarioStatus && FAILURE_STATUSES.has(scenarioStatus);
  if (!failed) return false;
  if (resolveHeadless(parameters)) return false;
  return toBoolean(parameters?.skipCloseOnFailure, false);
}

