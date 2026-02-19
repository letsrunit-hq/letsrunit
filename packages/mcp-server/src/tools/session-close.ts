import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SessionManager } from '../sessions';
import { err, text } from '../utility/response';

export function registerSessionClose(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_session_close',
    {
      description: 'Close a browser session and release its resources.',
      inputSchema: {
        sessionId: z.string().describe('Session ID to close'),
      },
    },
    async (input) => {
      try {
        await sessions.close(input.sessionId);
        return text(JSON.stringify({ closed: true }));
      } catch (e) {
        return err(`Failed to close session: ${(e as Error).message}`);
      }
    },
  );
}
