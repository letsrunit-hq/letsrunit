import { createRequire } from 'module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { bootstrapProjectServer } from './bootstrap';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };
bootstrapProjectServer();

const { SessionManager } = await import('./sessions');
const {
  registerDebug,
  registerDiagnostics,
  registerDiff,
  registerListSteps,
  registerListSessions,
  registerRun,
  registerScreenshot,
  registerSessionClose,
  registerSessionStart,
  registerSnapshot,
} = await import('./tools');

const sessions = new SessionManager();

const server = new McpServer({
  name: 'letsrunit',
  version,
  websiteUrl: 'https://letsrunit.ai',
});

registerSessionStart(server, sessions);
registerRun(server, sessions);
registerSnapshot(server, sessions);
registerScreenshot(server, sessions);
registerDebug(server, sessions);
registerSessionClose(server, sessions);
registerListSteps(server, sessions);
registerListSessions(server, sessions);
registerDiff(server, sessions);
if (process.env.LETSRUNIT_MCP_DIAGNOSTICS === 'enabled') {
  registerDiagnostics(server);
}

const transport = new StdioServerTransport();
await server.connect(transport);
