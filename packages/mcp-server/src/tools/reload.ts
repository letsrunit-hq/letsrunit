import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpRuntimeMode } from '../bootstrap';
import { err, text } from '../utility/response';
import { reloadSupportFiles } from '../utility/support';

type Options = {
  runtimeMode: McpRuntimeMode;
};

async function resetBuiltInStepRegistry(): Promise<void> {
  const bdd = (await import('@letsrunit/bdd')) as Record<string, unknown>;
  const reset = bdd.resetRegistryToBuiltInSteps;
  if (typeof reset !== 'function') {
    throw new Error(
      'Installed @letsrunit/bdd does not expose resetRegistryToBuiltInSteps. Update @letsrunit/bdd to a compatible version.',
    );
  }
  reset();
}

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
        await resetBuiltInStepRegistry();
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
