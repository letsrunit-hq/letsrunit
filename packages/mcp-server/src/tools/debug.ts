import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type SessionManager } from '../sessions';
import { text } from '../utility/response';

export function registerDebug(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_debug',
    {
      description:
        'Evaluate JavaScript on the current page via Playwright page.evaluate(). Use for debugging — not for test logic.',
      inputSchema: {
        sessionId: z.string().describe('Session ID'),
        script: z.string().describe('JavaScript expression or function body to evaluate in the page context'),
      },
    },
    async (input) => {
      try {
        const session = sessions.get(input.sessionId);
        sessions.touch(input.sessionId);

        const result = await session.controller.page.evaluate(input.script);
        return text(JSON.stringify({ result }));
      } catch (e) {
        return text(JSON.stringify({ result: null, error: (e as Error).message }));
      }
    },
  );
}
