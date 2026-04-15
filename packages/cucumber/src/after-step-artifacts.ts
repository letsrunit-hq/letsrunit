import type { ICreateAttachment } from '@cucumber/cucumber';
import { type Page } from '@playwright/test';
import { scrubHtml } from '@letsrunit/playwright';
import { logUnexpectedError } from './unexpected-error-log';

type AfterStepWorld = {
  page?: Page;
  attach: ICreateAttachment;
};

type CaptureDeps = {
  scrubHtmlFn?: typeof scrubHtml;
  logUnexpectedErrorFn?: typeof logUnexpectedError;
};

function resolvePageUrl(page: Page): string | null {
  try {
    return page.url();
  } catch {
    return null;
  }
}

export async function captureAfterStepArtifacts(world: AfterStepWorld, deps: CaptureDeps = {}): Promise<void> {
  const page = world.page;
  if (!page) return;

  const url = resolvePageUrl(page);
  if (!url || url === 'about:blank') return;

  const scrubHtmlFn = deps.scrubHtmlFn ?? scrubHtml;
  const logUnexpectedErrorFn = deps.logUnexpectedErrorFn ?? logUnexpectedError;

  let screenshot: Buffer | null = null;
  let html: string | null = null;

  try {
    screenshot = await page.screenshot();
  } catch (error) {
    await logUnexpectedErrorFn('cucumber.after_step.capture.screenshot', error, { url });
  }

  try {
    html = await scrubHtmlFn(page);
  } catch (error) {
    await logUnexpectedErrorFn('cucumber.after_step.capture.scrub_html', error, { url });
  }

  try {
    await world.attach(url, 'text/x-letsrunit-url');
    if (screenshot) await world.attach(screenshot, 'image/png');
    if (html) await world.attach(html, 'text/html');
  } catch (error) {
    await logUnexpectedErrorFn('cucumber.after_step.capture.attach', error, { url });
  }
}
