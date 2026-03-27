import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { collectSupportDiagnostics } from '../utility/support';
import { err, text } from '../utility/response';

export function registerDiagnostics(server: McpServer): void {
  server.registerTool(
    'letsrunit_diagnostics',
    {
      description:
        'Return runtime diagnostics for MCP support-file loading (cwd resolution, cucumber config path, support entries). Available only when LETSRUNIT_MCP_DIAGNOSTICS=enabled.',
      inputSchema: {},
    },
    async () => {
      try {
        const diagnostics = await collectSupportDiagnostics();
        return text(JSON.stringify(diagnostics));
      } catch (e) {
        return err(`Diagnostics failed: ${(e as Error).message}`);
      }
    },
  );
}
