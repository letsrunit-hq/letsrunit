import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = args[i + 1];
    result[key] = value;
    i += 1;
  }

  return result;
}

function parseToolResponse(response) {
  if (!response || response.isError) {
    return { isError: true, value: response?.content?.[0]?.text ?? response };
  }
  const text = response.content?.[0]?.text;
  if (typeof text !== 'string') return { isError: false, value: response };
  try {
    return { isError: false, value: JSON.parse(text) };
  } catch {
    return { isError: false, value: text };
  }
}

async function callTool(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  const parsed = parseToolResponse(result);
  if (parsed.isError) throw new Error(`${name} failed: ${JSON.stringify(parsed.value)}`);
  return parsed.value;
}

async function main() {
  const args = parseArgs();
  const serverPath = args.server;
  const baseUrl = args.baseUrl;

  if (!serverPath || !baseUrl) {
    throw new Error(
      'Usage: node run-deterministic-flow.mjs --server <path-to-mcp-server-dist-index.js> --baseUrl <http://host:port>',
    );
  }

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    stderr: 'pipe',
  });
  transport.stderr?.on('data', (chunk) => process.stderr.write(chunk));

  const client = new Client({ name: 'mcp-integration-deterministic', version: '1.0.0' });
  await client.connect(transport);

  try {
    const { tools } = await client.listTools();
    if (!tools.some((tool) => tool.name === 'letsrunit_session_start')) {
      throw new Error('Missing letsrunit_session_start tool');
    }

    const started = await callTool(client, 'letsrunit_session_start', {
      baseURL: baseUrl,
      headless: true,
    });
    if (!started?.sessionId || typeof started.sessionId !== 'string') {
      throw new Error(`Invalid session_start response: ${JSON.stringify(started)}`);
    }
    const { sessionId } = started;

    const runResult = await callTool(client, 'letsrunit_run', {
      sessionId,
      input: `Given I'm on the homepage\nThen the page contains text "Welcome"`,
    });
    if (runResult?.status !== 'passed') {
      throw new Error(`Run did not pass: ${JSON.stringify(runResult)}`);
    }

    const snapshotResult = await callTool(client, 'letsrunit_snapshot', {
      sessionId,
      scrubScripts: true,
      scrubStyles: true,
      scrubComments: true,
    });
    if (!snapshotResult?.html || typeof snapshotResult.html !== 'string') {
      throw new Error(`Snapshot did not return html: ${JSON.stringify(snapshotResult)}`);
    }

    const screenshotResult = await callTool(client, 'letsrunit_screenshot', { sessionId });
    if (!screenshotResult?.path || typeof screenshotResult.path !== 'string') {
      throw new Error(`Screenshot did not return path: ${JSON.stringify(screenshotResult)}`);
    }

    const listed = await callTool(client, 'letsrunit_list_sessions', {});
    if (!Array.isArray(listed?.sessions) || !listed.sessions.some((session) => session.id === sessionId)) {
      throw new Error(`Session not found in list_sessions: ${JSON.stringify(listed)}`);
    }

    await callTool(client, 'letsrunit_session_close', { sessionId });
  } finally {
    await client.close();
  }
}

await main();
