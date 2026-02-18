/**
 * Integration test for @letsrunit/mcp-server against localhost:3000
 * Run from repo root: node packages/mcp-server/test-integration.mjs
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = resolve(__dir, 'dist/index.js');
const TARGET = 'http://localhost:3000';

function log(label, data) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`▶ ${label}`);
  if (data !== undefined) {
    const str = JSON.stringify(data, null, 2);
    console.log(str.length > 1200 ? str.slice(0, 1200) + '\n  …(truncated)' : str);
  }
}

function parseResult(result) {
  if (result?.isError) return { error: result.content?.[0]?.text };
  const text = result?.content?.[0]?.text;
  if (!text) return result;
  try { return JSON.parse(text); } catch { return text; }
}

async function run() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [SERVER_PATH],
    stderr: 'pipe',
  });

  const client = new Client({ name: 'test', version: '1.0.0' });
  transport.stderr?.on('data', (d) => process.stderr.write('[mcp] ' + d));

  log('Connecting to MCP server...');
  await client.connect(transport);

  const { tools } = await client.listTools();
  log('Available tools', tools.map(t => t.name));

  // session_start
  const startResult = parseResult(
    await client.callTool({ name: 'letsrunit_session_start', arguments: { headless: true } })
  );
  log('letsrunit_session_start', startResult);
  if (!startResult.sessionId) throw new Error('No sessionId: ' + JSON.stringify(startResult));
  const { sessionId } = startResult;

  // run: navigate
  const navResult = parseResult(
    await client.callTool({
      name: 'letsrunit_run',
      arguments: { sessionId, input: `Given I'm on page "${TARGET}"` },
    })
  );
  log(`letsrunit_run — navigate to ${TARGET}`, {
    success: navResult.success,
    url: navResult.url,
    error: navResult.error,
    logs: navResult.logs?.length + ' entries',
    artifacts: navResult.artifacts?.length + ' files',
  });
  if (!navResult.success) throw new Error('Navigation failed: ' + navResult.error);

  // snapshot
  const snapResult = parseResult(
    await client.callTool({
      name: 'letsrunit_snapshot',
      arguments: { sessionId, scrubScripts: true, scrubStyles: true, scrubComments: true },
    })
  );
  log('letsrunit_snapshot', {
    url: snapResult.url,
    htmlLength: snapResult.html?.length,
    preview: snapResult.html?.slice(0, 300),
  });

  // screenshot
  const shotResult = parseResult(
    await client.callTool({
      name: 'letsrunit_screenshot',
      arguments: { sessionId },
    })
  );
  log('letsrunit_screenshot', shotResult);

  // debug
  const debugResult = parseResult(
    await client.callTool({
      name: 'letsrunit_debug',
      arguments: { sessionId, script: 'document.title' },
    })
  );
  log('letsrunit_debug — document.title', debugResult);

  // list_sessions
  const listResult = parseResult(
    await client.callTool({ name: 'letsrunit_list_sessions', arguments: {} })
  );
  log('letsrunit_list_sessions', listResult);

  // session_close
  const closeResult = parseResult(
    await client.callTool({ name: 'letsrunit_session_close', arguments: { sessionId } })
  );
  log('letsrunit_session_close', closeResult);

  await client.close();
  console.log(`\n${'─'.repeat(60)}`);
  console.log('✅  All tools tested successfully');
}

run().catch((e) => {
  console.error('\n❌  Test failed:', e.message);
  process.exit(1);
});
