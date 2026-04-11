import { resetRegistryToBuiltInSteps } from '@letsrunit/bdd';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpRuntimeMode } from '../bootstrap';
import { err, text } from '../utility/response';
import { reloadSupportFiles } from '../utility/support';

type Options = {
  runtimeMode: McpRuntimeMode;
};

export function registerReload(server: McpServer, options: Options): void {
  server.registerTool(
    'letsrunit_reload',
    {
      description:
        'Reload built-in and project support step definitions without restarting the MCP server.',
      inputSchema: {
        cwd: z
          .string()
          .optional()
          .describe('Project directory to resolve cucumber support files from. Defaults to current project cwd.'),
      },
    },
    async (input) => {
      if (options.runtimeMode !== 'project') {
        return err('Reload failed: letsrunit_reload is only available in project runtime mode.');
      }

      try {
        resetRegistryToBuiltInSteps();
        const result = await reloadSupportFiles(input.cwd);
        return text(
          JSON.stringify({
            reloaded: true,
            projectRoot: result.projectRoot,
            supportEntriesLoaded: result.supportEntriesLoaded,
            ignoredEntries: result.ignoredEntries,
          }),
        );
      } catch (e) {
        return err(`Reload failed: ${(e as Error).message}`);
      }
    },
  );
}
