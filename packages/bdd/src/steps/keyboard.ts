import type { KeyCombo } from '@letsrunit/gherkin';
import { sleep } from '@letsrunit/utils';
import { When } from './wrappers';

const DELAY = 500;

export const press = When('I press {keys}', async function (combo: KeyCombo) {
  // Hold modifiers
  for (const m of combo.modifiers) await this.page.keyboard.down(m);

  // Press final key
  await this.page.keyboard.press(combo.key);

  // Release modifiers (reverse order)
  for (const m of combo.modifiers.toReversed()) await this.page.keyboard.up(m);

  await sleep(DELAY);
});

export const type = When('I type {string}', async function (value: string) {
  await this.page.keyboard.type(value, { delay: 200 });
  await sleep(DELAY);
});
