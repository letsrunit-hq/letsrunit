import { locator } from '@letsrunit/playwright';
import type { Locator } from '@playwright/test';
import { When } from './wrappers';

const TIMEOUT = 500;

async function copyInput(el: Locator): Promise<string | undefined> {
  try {
    return await el.inputValue();
  } catch {}
}

async function copyLink(el: Locator): Promise<string | undefined> {
  try {
    const tag = (await el.evaluate?.((n: Element) => n.tagName.toLowerCase())) as string | undefined;
    const href = tag === 'a' ? await el.getAttribute?.('href') : null;
    if (href) {
      return href.startsWith('mailto:') ? href.replace(/^mailto:/i, '') : href;
    }
  } catch {}
}

async function copyText(el: Locator): Promise<string | null> {
  return (await el.textContent?.()) ?? null;
}

export const copy = When('I copy {locator} to the clipboard', async function (selector: string) {
  const el = await locator(this.page, selector);
  let value = (await copyInput(el)) ?? (await copyLink(el)) ?? (await copyText(el));

  this.clipboard = { value };
});

export const paste = When('I paste from the clipboard into {locator}', async function (selector: string) {
  const el = await locator(this.page, selector);
  const value = this.clipboard?.value || '';

  await el.fill(String(value), { timeout: TIMEOUT });
});
