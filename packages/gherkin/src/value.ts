import { parseDateString, type Scalar } from '@letsrunit/utils';
import { createHmac } from 'node:crypto';

export const scalarRegexp =
  /password of "((?:[^"\\]+|\\.)*)"|"((?:[^"\\]+|\\.)*)"|(-?\d+(?:\.\d+)?)|date (?:of )?((?:today|tomorrow|yesterday|\d+ \w+ (?:ago|from now))(?: (?:at )?\d\d?:\d\d?(?::\d\d?)?)?|"\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:.\d{3})?Z?)?")/;
export const arrayRegexp = new RegExp(String.raw`\[(.*?)\]`);

function requirePasswordSeed(): string {
  const seed = process.env.LETSRUNIT_PASSWORD_SEED?.trim();
  if (!seed) {
    throw new Error('LETSRUNIT_PASSWORD_SEED is required to use password values (password of "...").');
  }

  return seed;
}

function buildPassword(input: string): string {
  const digest = createHmac('sha256', requirePasswordSeed()).update(input).digest('hex');
  return `Lr!${digest.slice(0, 18)}a1`;
}

function transformScalar(password?: string, str?: string, num?: string, date?: string): Scalar {
  if (password != null) return buildPassword(password);
  if (str != null) return str;
  if (num != null) return Number(num);
  if (date) return parseDateString(date);

  throw new Error('Unexpected value');
}

export const valueTransformer = (
  password?: string,
  str?: string,
  num?: string,
  date?: string,
  arr?: string,
): Scalar | Scalar[] => {
  return arr
    ? Array.from(arr.matchAll(new RegExp(scalarRegexp, 'g')), (m) => transformScalar(m[1], m[2], m[3], m[4]))
    : transformScalar(password, str, num, date);
};
