import { createHash } from 'node:crypto';

const TAGS = {
  step: 0x0001,
  scenario: 0x0002,
  feature: 0x0003,
  rule: 0x0004,
  outline: 0x0005,
  exampleRow: 0x0006,
} as const;

function encodeTag(tag: number): Buffer {
  const buf = Buffer.allocUnsafe(2);
  buf.writeUInt16BE(tag, 0);
  return buf;
}

function hashBytes(tag: number, payload: Buffer): string {
  return createHash('sha256').update(encodeTag(tag)).update(payload).digest('hex');
}

function concatHexIds(ids: string[]): Buffer {
  if (ids.length === 0) return Buffer.alloc(0);
  return Buffer.concat(ids.map((id) => Buffer.from(id, 'hex')));
}

function encodeStrings(parts: string[]): Buffer {
  const encoded: Buffer[] = [];
  for (const part of parts) {
    const chunk = Buffer.from(part, 'utf8');
    const len = Buffer.allocUnsafe(4);
    len.writeUInt32BE(chunk.length, 0);
    encoded.push(len, chunk);
  }

  return Buffer.concat(encoded);
}

export function computeStepId(normalizedText: string): string {
  return hashBytes(TAGS.step, Buffer.from(normalizedText, 'utf8'));
}

export function computeScenarioId(stepIds: string[]): string {
  return hashBytes(TAGS.scenario, concatHexIds(stepIds));
}

export function computeFeatureId(scenarioIds: string[]): string {
  return hashBytes(TAGS.feature, concatHexIds(scenarioIds));
}

export function computeRuleId(scenarioIds: string[]): string {
  return hashBytes(TAGS.rule, concatHexIds(scenarioIds));
}

export function computeOutlineId(stepIds: string[]): string {
  return hashBytes(TAGS.outline, concatHexIds(stepIds));
}

export function computeExampleRowId(values: string[]): string {
  return hashBytes(TAGS.exampleRow, encodeStrings(values));
}

function hashId(input: string): Buffer {
  return createHash('sha256').update(input, 'utf8').digest();
}

export function toIdBlob(id: string): Buffer {
  const normalized = id.toLowerCase();
  if (/^[0-9a-f]{64}$/.test(normalized)) {
    return Buffer.from(normalized, 'hex');
  }

  return hashId(id);
}

export function fromIdBlob(id: Uint8Array): string {
  return Buffer.from(id).toString('hex');
}
