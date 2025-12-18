import type { KeyCombo } from '@letsrunit/gherkin';
import { When } from './wrappers';

export const press = When('I press {keys}', async function (combo: KeyCombo) {
  // Hold modifiers
  for (const m of combo.modifiers) await this.page.keyboard.down(m);

  // Press final key
  await this.page.keyboard.press(combo.key);

  // Release modifiers (reverse order)
  for (const m of combo.modifiers.toReversed()) await this.page.keyboard.up(m);
});
