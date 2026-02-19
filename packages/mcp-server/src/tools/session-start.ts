import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SessionManager } from '../sessions';
import { err, text } from '../utility/response';

export function registerSessionStart(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_session_start',
    {
      description:
        'Launch a new browser session. Does not navigate anywhere — use letsrunit_run with a Given step to navigate.',
      inputSchema: {
        language: z.string().optional().describe("Browser language code, e.g. 'en', 'fr'"),
        headless: z.boolean().optional().describe('Run browser in headless mode (default: true)'),
        viewportWidth: z.number().int().optional().describe('Viewport width in pixels (default: 1280)'),
        viewportHeight: z.number().int().optional().describe('Viewport height in pixels (default: 720)'),
      },
    },
    async (input) => {
      try {
        const viewport =
          input.viewportWidth || input.viewportHeight
            ? { width: input.viewportWidth ?? 1280, height: input.viewportHeight ?? 720 }
            : undefined;

        const session = await sessions.create({
          headless: input.headless ?? true,
          locale: input.language,
          viewport,
        });

        return text(JSON.stringify({ sessionId: session.id }));
      } catch (e) {
        return err(`Failed to start session: ${(e as Error).message}`);
      }
    },
  );
}
