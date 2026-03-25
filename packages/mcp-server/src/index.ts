import { createRequire } from 'module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SessionManager } from './sessions';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };
import {
  registerDebug,
  registerDiff,
  registerListSessions,
  registerRun,
  registerScreenshot,
  registerSessionClose,
  registerSessionStart,
  registerSnapshot,
} from './tools';

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
registerListSessions(server, sessions);
registerDiff(server, sessions);

const transport = new StdioServerTransport();
await server.connect(transport);
