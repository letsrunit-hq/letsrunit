import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SessionManager } from './sessions';
import {
  registerDebug,
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
  version: '0.1.0',
  websiteUrl: 'https://letsrunit.ai',
});

registerSessionStart(server, sessions);
registerRun(server, sessions);
registerSnapshot(server, sessions);
registerScreenshot(server, sessions);
registerDebug(server, sessions);
registerSessionClose(server, sessions);
registerListSessions(server, sessions);

const transport = new StdioServerTransport();
await server.connect(transport);
