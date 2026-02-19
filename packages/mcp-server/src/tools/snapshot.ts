import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { scrubHtml } from '@letsrunit/playwright';
import { z } from 'zod';
import { type SessionManager } from '../sessions';
import { err, text } from '../utility/response';

export function registerSnapshot(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_snapshot',
    {
      description:
        'Get the current page HTML, scrubbed for LLM consumption. Use selector to scope to a DOM subtree.',
      inputSchema: {
        sessionId: z.string().describe('Session ID'),
        selector: z
          .string()
          .optional()
          .describe("CSS selector — return only the matching element's outer HTML instead of the full page"),
        dropHidden: z.boolean().optional().describe('Remove hidden/inert nodes (default: true)'),
        dropHead: z.boolean().optional().describe('Remove the <head> element (default: true)'),
        pickMain: z.boolean().optional().describe('Keep only the <main> element (default: auto)'),
        stripAttributes: z
          .union([z.literal(0), z.literal(1), z.literal(2)])
          .optional()
          .describe('Attribute allowlist level: 0=none, 1=semantic (default), 2=aggressive'),
      },
    },
    async (input) => {
      try {
        const session = sessions.get(input.sessionId);
        sessions.touch(input.sessionId);

        const page = session.controller.page;
        const url = page.url();

        const opts = {
          dropHidden: input.dropHidden,
          dropHead: input.dropHead,
          pickMain: input.pickMain,
          stripAttributes: input.stripAttributes,
        };

        let html: string;

        if (input.selector) {
          const rawHtml = await page
            .locator(input.selector)
            .first()
            .evaluate((el: Element) => el.outerHTML);
          html = await scrubHtml({ html: rawHtml, url }, opts);
        } else {
          html = await scrubHtml(page, opts);
        }

        return text(JSON.stringify({ url, html }));
      } catch (e) {
        return err(`Snapshot failed: ${(e as Error).message}`);
      }
    },
  );
}
