import type { Page } from '@playwright/test';

export function isPage(page: any): page is Page {
  return typeof page.content === 'function'
    && typeof page.url === 'function'
    && typeof page.screenshot === 'function';
}
