import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { bootstrapProjectServer } from './bootstrap';

declare const __LETSRUNIT_VERSION__: string | undefined;

const version = typeof __LETSRUNIT_VERSION__ === 'string' ? __LETSRUNIT_VERSION__ : 'unknown';
const runtimeMode = bootstrapProjectServer();

const { SessionManager } = await import('./sessions');
const {
  registerDebug,
  registerDiagnostics,
  registerDiff,
  registerListSteps,
  registerListSessions,
  registerReload,
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

registerSessionStart(server, sessions, { runtimeMode });
registerRun(server, sessions);
registerSnapshot(server, sessions);
registerScreenshot(server, sessions);
registerDebug(server, sessions);
registerSessionClose(server, sessions);
registerListSteps(server, sessions);
registerListSessions(server, sessions);
registerReload(server, { runtimeMode });
registerDiff(server, sessions);
if (process.env.LETSRUNIT_MCP_DIAGNOSTICS === 'enabled') {
  registerDiagnostics(server, sessions);
}

const transport = new StdioServerTransport();
await server.connect(transport);
