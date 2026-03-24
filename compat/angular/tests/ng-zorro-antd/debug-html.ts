import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const HTML_DUMP_DIR = '/tmp/compat-angular-html';

function sanitize(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 180);
}

type MinimalTestType = {
  afterEach: (
    callback: (args: { page: { content: () => Promise<string> } }, testInfo: any) => Promise<void>,
  ) => void;
};

export function registerHtmlDump(test: MinimalTestType): void {
  test.afterEach(async ({ page }, testInfo) => {
    await mkdir(HTML_DUMP_DIR, { recursive: true });

    const titlePath = Array.isArray(testInfo.titlePath) ? testInfo.titlePath.join('__') : testInfo.title;
    const parts = [
      sanitize(path.basename(String(testInfo.file || 'unknown.spec.ts'))),
      sanitize(titlePath || 'unknown_test'),
      `retry${String(testInfo.retry ?? 0)}`,
      sanitize(String(testInfo.status || 'unknown')),
    ];
    const fileName = `${parts.filter(Boolean).join('--')}.html`;
    const filePath = path.join(HTML_DUMP_DIR, fileName);

    const html = await page.content();
    await writeFile(filePath, html, 'utf8');
  });
}
