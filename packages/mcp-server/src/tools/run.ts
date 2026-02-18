import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SessionManager } from '../sessions';
import { normalizeGherkin } from '../utility/gherkin';
import { err, text } from '../utility/response';

export function registerRun(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_run',
    {
      description:
        'Execute Gherkin steps or a complete feature in the browser. ' +
        'Accepts a single step line, multiple step lines, a full Scenario, or a full Feature. ' +
        'Returns status, steps, reason on failure, and journal entries. Does not return a page snapshot — call letsrunit_snapshot explicitly if you need the DOM.',
      inputSchema: {
        sessionId: z.string().describe('Session ID returned by letsrunit_session_start'),
        input: z
          .string()
          .describe(
            'Gherkin text to execute: one or more step lines (e.g. "Given I am on \\"https://example.com\\""), a Scenario block, or a full Feature block.',
          ),
      },
    },
    async (input) => {
      try {
        const session = sessions.get(input.sessionId);
        sessions.touch(input.sessionId);

        const feature = normalizeGherkin(input.input);

        session.sink.clear();
        const result = await session.controller.run(feature);
        session.stepCount += result.steps.length;

        return text(
          JSON.stringify({
            status: result.status,
            steps: result.steps,
            reason: result.reason?.message,
            journal: session.sink.getEntries(),
          }),
        );
      } catch (e) {
        return err(`Run failed: ${(e as Error).message}`);
      }
    },
  );
}
