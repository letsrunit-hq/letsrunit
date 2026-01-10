import type { Loc, SetOptions, Value } from './types';

export async function setOtpValue({ el, tag }: Loc, value: Value, options?: SetOptions): Promise<boolean> {
  if (typeof value !== 'string') return false;
  if (tag === 'input' || tag === 'select' || tag === 'button' || tag === 'textarea') return false;

  const chars = value.replace(/\W/g, '').split('');
  if (chars.length < 3 || chars.length > 8) return false;

  // Find all text inputs as child of el
  const inputs = await el.locator('input[type="text"], input:not([type])').all();

  // Check if the number of input matches the number of characters. If not, return false.
  if (inputs.length !== chars.length) return false;

  // Fill out each input with one character.
  for (let i = 0; i < chars.length; i++) {
    await inputs[i].fill(chars[i], options);
  }

  return true;
}
