import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type SessionManager } from '../sessions';
import { text } from '../utility/response';

export function registerListSessions(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_list_sessions',
    {
      description: 'List all active browser sessions.',
      inputSchema: {},
    },
    async () => {
      const list = sessions.list().map((s) => ({
        sessionId: s.id,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
        stepCount: s.stepCount,
        artifactDir: s.artifactDir,
      }));

      return text(JSON.stringify({ sessions: list }));
    },
  );
}
