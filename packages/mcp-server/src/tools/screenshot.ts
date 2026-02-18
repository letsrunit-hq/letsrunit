import { screenshot, screenshotElement } from '@letsrunit/playwright';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { type SessionManager } from '../sessions';
import { err, text } from '../utility/response';

export function registerScreenshot(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_screenshot',
    {
      description:
        'Take a screenshot of the current page. Optionally crop to a specific element (selector) or highlight elements before capturing (mask).',
      inputSchema: {
        sessionId: z.string().describe('Session ID'),
        selector: z
          .string()
          .optional()
          .describe('CSS selector — crop screenshot to the bounding box of this element'),
        mask: z
          .array(z.string())
          .optional()
          .describe('CSS selectors whose matching elements are highlighted (dark overlay, element spotlighted)'),
        fullPage: z.boolean().optional().describe('Capture the full scrollable page (default: false)'),
      },
    },
    async (input) => {
      try {
        const session = sessions.get(input.sessionId);
        sessions.touch(input.sessionId);

        const page = session.controller.page;

        let file: File;

        if (input.selector) {
          file = await screenshotElement(page, input.selector);
        } else {
          const masks = input.mask?.map((sel) => page.locator(sel)) ?? [];
          file = await screenshot(page, {
            fullPage: input.fullPage ?? false,
            ...(masks.length ? { mask: masks } : {}),
          });
        }

        await mkdir(session.artifactDir, { recursive: true });
        const path = join(session.artifactDir, file.name);
        await writeFile(path, await file.bytes());

        return text(JSON.stringify({ path, mimeType: 'image/png' }));
      } catch (e) {
        return err(`Screenshot failed: ${(e as Error).message}`);
      }
    },
  );
}
