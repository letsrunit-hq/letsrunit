export type FailureDetails = {
  error?: string;
  locator?: string;
  locatorFuzzy?: boolean;
  locatorFull?: string;
  url?: string;
  expected?: string;
  actual?: string;
  timeoutMs?: number;
};

export function isStackLine(line: string): boolean {
  return /^\s*at\s+/.test(line);
}

export function stripAnsi(input: string): string {
  const pattern =
    /[\u001B\u009B][[\]()#;?]*(?:((?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~])/g;
  return input.replace(pattern, '');
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
  } catch {
    return url.trim();
  }
}

export function extractUrlFromMessage(lines: string[]): string | undefined {
  for (const line of lines) {
    const match = line.match(/\bURL:\s*(\S+)/i);
    if (match) return match[1];
  }
  return undefined;
}

export function extractPrimaryLocator(raw: string): string {
  const withoutMarker = raw.replace(/\s*\{fuzzy\}\s*$/i, '').trim();
  const firstLocatorMatch = withoutMarker.match(/locator\((['"`])([\s\S]*?)\1\)/);
  if (!firstLocatorMatch) return withoutMarker;
  return firstLocatorMatch[2].trim() || withoutMarker;
}

export function simplifyLocator(locator: string): { locator: string; fuzzy: boolean } {
  const raw = locator.trim();
  return {
    locator: extractPrimaryLocator(raw),
    fuzzy: raw.includes('{fuzzy}'),
  };
}

export function extractLocatorRaw(lines: string[]): string | undefined {
  const line = lines.find((l) => l.trim().startsWith('Locator:'));
  if (!line) return undefined;
  const raw = line.replace(/^\s*Locator:\s*/, '').trim();
  return raw || undefined;
}

export function extractLocator(lines: string[]): string | undefined {
  const raw = extractLocatorRaw(lines);
  if (!raw) return undefined;
  return simplifyLocator(raw).locator;
}

export function extractLocatorFuzzy(lines: string[]): boolean | undefined {
  const raw = extractLocatorRaw(lines);
  if (!raw) return undefined;
  return simplifyLocator(raw).fuzzy;
}

export function extractExpected(lines: string[]): string | undefined {
  const line = lines.find((l) => l.trim().startsWith('Expected:'));
  if (!line) return undefined;
  return line.replace(/^\s*Expected:\s*/, '').trim() || undefined;
}

export function extractActual(lines: string[]): string | undefined {
  const line = lines.find((l) => l.trim().startsWith('Received:'));
  if (!line) return undefined;
  return line.replace(/^\s*Received:\s*/, '').trim() || undefined;
}

export function extractTimeoutMs(lines: string[]): number | undefined {
  const line = lines.find((l) => l.trim().startsWith('Timeout:'));
  if (!line) return undefined;
  const match = line.match(/(\d+)\s*ms/i);
  if (!match) return undefined;
  return Number(match[1]);
}

export function extractErrorSummary(lines: string[]): string | undefined {
  const callLogIdx = lines.findIndex((line) => line.trim().startsWith('Call log:'));
  const stackIdx = lines.findIndex(isStackLine);
  let cutOff = lines.length;
  if (callLogIdx >= 0) cutOff = Math.min(cutOff, callLogIdx);
  if (stackIdx >= 0) cutOff = Math.min(cutOff, stackIdx);

  const candidates: string[] = [];
  for (let i = 0; i < cutOff; i += 1) {
    const match = lines[i].match(/^\s*Error:\s*(.+)\s*$/);
    if (match) candidates.push(match[1].trim());
  }

  if (candidates.length > 0) return candidates[candidates.length - 1];

  return lines
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !isStackLine(line) && !line.startsWith('Call log:'));
}

export function extractFailureDetails(message?: string): FailureDetails {
  if (!message) return {};

  const lines = stripAnsi(message).split('\n');

  return {
    error: extractErrorSummary(lines),
    locator: extractLocator(lines),
    locatorFuzzy: extractLocatorFuzzy(lines),
    locatorFull: extractLocatorRaw(lines),
    url: extractUrlFromMessage(lines),
    expected: extractExpected(lines),
    actual: extractActual(lines),
    timeoutMs: extractTimeoutMs(lines),
  };
}
