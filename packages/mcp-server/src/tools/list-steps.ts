import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type SessionManager } from '../sessions';
import { err, text } from '../utility/response';

const stepTypeSchema = z.enum(['Given', 'When', 'Then']);

export function registerListSteps(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_list_steps',
    {
      description:
        'List available step definitions for a session. Optionally filter by step type (Given/When/Then).',
      inputSchema: {
        sessionId: z.string().describe('Session ID returned by letsrunit_session_start'),
        type: stepTypeSchema.optional().describe('Optional step type filter'),
      },
    },
    async (input) => {
      try {
        const session = sessions.get(input.sessionId);
        sessions.touch(input.sessionId);

        const steps = session.controller.listSteps(input.type);
        return text(JSON.stringify({ steps }));
      } catch (e) {
        return err(`List steps failed: ${(e as Error).message}`);
      }
    },
  );
}
