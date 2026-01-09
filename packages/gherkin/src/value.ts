import { parseDateString, type Scalar } from '@letsrunit/utils';

export const scalarRegexp =
  /"((?:[^"\\]+|\\.)*)"|(-?\d+(?:\.\d+)?)|date (?:of )?((?:today|tomorrow|yesterday|\d+ \w+ (?:ago|from now))(?: (?:at )?\d{2}:\d{2}?(?::\d{2})?)?|"\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:.\d{3})?Z?)?")/;
export const arrayRegexp = new RegExp(String.raw`\[(.*?)\]`);

function transformScalar(str?: string, num?: string, date?: string): Scalar {
  if (str != null) return str;
  if (num != null) return Number(num);
  if (date) return parseDateString(date);

  throw new Error('Unexpected value');
}

export const valueTransformer = (
  str?: string,
  num?: string,
  date?: string,
  arr?: string,
): Scalar | Scalar[] => {
  return arr
    ? Array.from(arr.matchAll(new RegExp(scalarRegexp, 'g')), (m) => transformScalar(m[1], m[2], m[3]))
    : transformScalar(str, num, date);
};
