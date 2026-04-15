import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SessionManager } from '../sessions';
import { collectDiagnostics } from '../utility/diagnostics';
import { err, text } from '../utility/response';

export function registerDiagnostics(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_diagnostics',
    {
      description:
        'Return runtime diagnostics for MCP support-file loading (cwd resolution, cucumber config path, support entries). Available only when LETSRUNIT_MCP_DIAGNOSTICS=enabled.',
      inputSchema: {
        sessionId: z.string().describe('Session ID returned by letsrunit_session_start'),
      },
    },
    async (input) => {
      try {
        const diagnostics = await collectDiagnostics();
        const session = sessions.get(input.sessionId);
        const sessionInfo = {
          sessionId: session.id,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          stepCount: session.stepCount,
          artifactDir: session.artifactDir,
          pageUrl: session.controller.page.url(),
        };
        return text(JSON.stringify({ ...diagnostics, session: sessionInfo }));
      } catch (e) {
        return err(`Diagnostics failed: ${(e as Error).message}`);
      }
    },
  );
}
