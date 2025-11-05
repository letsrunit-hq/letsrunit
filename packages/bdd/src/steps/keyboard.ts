import type { KeyCombo } from '@letsrunit/gherkin';
import { When } from './wrappers';

export const press = When('I press {keys}', async ({ page }, combo: KeyCombo) => {
  // Hold modifiers
  for (const m of combo.modifiers) await page.keyboard.down(m);

  // Press final key
  await page.keyboard.press(combo.key);

  // Release modifiers (reverse order)
  for (const m of combo.modifiers.toReversed()) await page.keyboard.up(m);
});
