import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { bootstrapProjectServer } from './bootstrap';
import { SessionManager } from './sessions';
import {
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
} from './tools';

declare const __LETSRUNIT_VERSION__: string | undefined;

const version = typeof __LETSRUNIT_VERSION__ === 'string' ? __LETSRUNIT_VERSION__ : 'unknown';

async function main(): Promise<void> {
  const runtimeMode = bootstrapProjectServer(process.argv[1] ?? null);
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
}

void main();
